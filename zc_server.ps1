param(
    [switch]$HttpServer
)

if ($HttpServer) {
    $port = 8080
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Prefixes.Add("http://127.0.0.1:$port/")

    function Get-Database {
        $dbPath = Join-Path $PSScriptRoot "zc_db.json"
        if (Test-Path $dbPath) {
            $json = Get-Content $dbPath -Raw -Encoding UTF8
            return ConvertFrom-Json $json
        }
        return $null
    }

    function Save-Database($state) {
        $dbPath = Join-Path $PSScriptRoot "zc_db.json"
        $json = ConvertTo-Json -InputObject $state -Depth 10
        Set-Content -Path $dbPath -Value $json -Encoding UTF8
    }

    function Send-Json($response, $data, $statusCode = 200) {
        $json = ConvertTo-Json -InputObject $data -Depth 10
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
        $response.StatusCode = $statusCode
        $response.ContentType = "application/json; charset=utf-8"
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        $response.OutputStream.Close()
    }

    try {
        $listener.Start()
        Write-Host "ZC Operations Backend running at http://localhost:$port/" -ForegroundColor Cyan
        
        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            $response.KeepAlive = $false
            
            $urlPath = $request.Url.LocalPath
            $method = $request.HttpMethod
            
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
            
            if ($method -eq "OPTIONS") {
                $response.StatusCode = 200
                $response.OutputStream.Close()
                continue
            }
            
            # API Endpoints
            if ($urlPath.StartsWith("/api/")) {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $bodyStr = $reader.ReadToEnd()
                $reader.Close()
                $body = if ($bodyStr) { ConvertFrom-Json $bodyStr } else { $null }

                $db = Get-Database
                
                # --- Login ---
                if ($urlPath -eq "/api/login" -and $method -eq "POST") {
                    $user = $db.users | Where-Object { $_.username -eq $body.username -and $_.password -eq $body.password } | Select-Object -First 1
                    if ($user) {
                        # Simplified token: just passing base64 of username for demo purpose
                        $token = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($user.id))
                        Send-Json $response @{ success = $true; token = $token; user = $user }
                    } else {
                        Send-Json $response @{ success = $false; message = "Sai tài khoản hoặc mật khẩu" } 401
                    }
                    continue
                }

                # Simple auth check for other APIs
                $authHeader = $request.Headers["Authorization"]
                $currentUser = $null
                if ($authHeader -and $authHeader.StartsWith("Bearer ")) {
                    $token = $authHeader.Substring(7)
                    $userId = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($token))
                    $currentUser = $db.users | Where-Object { $_.id -eq $userId } | Select-Object -First 1
                }

                if (-not $currentUser) {
                    Send-Json $response @{ success = $false; message = "Vui lòng đăng nhập" } 401
                    continue
                }

                # --- DB Fetch (GET /api/data) ---
                if ($urlPath -eq "/api/data" -and $method -eq "GET") {
                    Send-Json $response $db
                    continue
                }

                # --- Orders API ---
                if ($urlPath -eq "/api/orders" -and $method -eq "POST") {
                    $body.id = "ord-" + [Guid]::NewGuid().ToString().Substring(0,8)
                    $body.createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
                    $db.preorders += $body
                    Save-Database $db
                    Send-Json $response @{ success = $true; data = $body }
                    continue
                }
                
                if ($urlPath -match "^/api/orders/(.+)$" -and $method -eq "PUT") {
                    $id = $Matches[1]
                    for ($i=0; $i -lt $db.preorders.Count; $i++) {
                        if ($db.preorders[$i].id -eq $id) {
                            $db.preorders[$i] = $body
                            Save-Database $db
                            Send-Json $response @{ success = $true; data = $body }
                            break
                        }
                    }
                    continue
                }

                # --- Tasks API ---
                if ($urlPath -eq "/api/tasks" -and $method -eq "POST") {
                    $body.id = "task-" + [Guid]::NewGuid().ToString().Substring(0,8)
                    $db.productionTasks += $body
                    Save-Database $db
                    Send-Json $response @{ success = $true; data = $body }
                    continue
                }
                
                # --- Upload API ---
                if ($urlPath -eq "/api/upload-base64" -and $method -eq "POST") {
                    try {
                        $b64 = $body.image -replace "^data:image/[a-zA-Z]+;base64,", ""
                        $bytes = [Convert]::FromBase64String($b64)
                        $filename = "img_" + [Guid]::NewGuid().ToString().Substring(0,8) + ".jpg"
                        $uploadsDir = Join-Path $PSScriptRoot "uploads"
                        if (-not (Test-Path $uploadsDir)) { New-Item -ItemType Directory -Force -Path $uploadsDir | Out-Null }
                        [System.IO.File]::WriteAllBytes((Join-Path $uploadsDir $filename), $bytes)
                        Send-Json $response @{ success = $true; url = "/uploads/$filename" }
                    } catch {
                        Send-Json $response @{ success = $false; message = $_.Exception.Message } 500
                    }
                    continue
                }
                
                if ($urlPath -match "^/api/tasks/(.+)$" -and $method -eq "PUT") {
                    $id = $Matches[1]
                    for ($i=0; $i -lt $db.productionTasks.Count; $i++) {
                        if ($db.productionTasks[$i].id -eq $id) {
                            $db.productionTasks[$i] = $body
                            Save-Database $db
                            Send-Json $response @{ success = $true; data = $body }
                            break
                        }
                    }
                    continue
                }

                # --- Settings API ---
                if ($urlPath -eq "/api/settings" -and $method -eq "PUT") {
                    $db.appSettings = $body
                    Save-Database $db
                    Send-Json $response @{ success = $true; data = $body }
                    continue
                }

                # --- Users API ---
                if ($urlPath -eq "/api/users" -and $method -eq "POST") {
                    $body.id = "u" + [Guid]::NewGuid().ToString().Substring(0,4)
                    $db.users += $body
                    Save-Database $db
                    Send-Json $response @{ success = $true; data = $body }
                    continue
                }
                
                if ($urlPath -match "^/api/users/(.+)$" -and $method -eq "PUT") {
                    $id = $Matches[1]
                    for ($i=0; $i -lt $db.users.Count; $i++) {
                        if ($db.users[$i].id -eq $id) {
                            $db.users[$i] = $body
                            Save-Database $db
                            Send-Json $response @{ success = $true; data = $body }
                            break
                        }
                    }
                    continue
                }

                # --- Violations API ---
                if ($urlPath -eq "/api/violations" -and $method -eq "POST") {
                    $body.id = "vio-" + [Guid]::NewGuid().ToString().Substring(0,8)
                    $db.violationRecords += $body
                    Save-Database $db
                    Send-Json $response @{ success = $true; data = $body }
                    continue
                }
                
                if ($urlPath -match "^/api/violations/(.+)$" -and $method -eq "PUT") {
                    $id = $Matches[1]
                    for ($i=0; $i -lt $db.violationRecords.Count; $i++) {
                        if ($db.violationRecords[$i].id -eq $id) {
                            $db.violationRecords[$i] = $body
                            
                            # If approved, deduct points
                            if ($body.status -eq "approved" -and $body.deductedPoints -gt 0) {
                                for ($u=0; $u -lt $db.users.Count; $u++) {
                                    if ($db.users[$u].id -eq $body.employeeId) {
                                        $db.users[$u].points -= $body.deductedPoints
                                        break
                                    }
                                }
                            }
                            
                            Save-Database $db
                            Send-Json $response @{ success = $true; data = $body }
                            break
                        }
                    }
                    continue
                }

                Send-Json $response @{ success = $false; message = "API Endpoint not found" } 404
                continue
            }
            
            # --- Static File Serving ---
            if ($urlPath -eq "/") { $urlPath = "/frontend/index.html" }
            if ($urlPath -eq "/login.html") { $urlPath = "/frontend/login.html" }
            
            $cleanPath = $urlPath.Replace("..", "").TrimStart('/')
            $filePath = Join-Path $PSScriptRoot $cleanPath
            
            if (Test-Path $filePath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                
                $contentType = "text/html; charset=utf-8"
                if ($ext -eq ".css") { $contentType = "text/css; charset=utf-8" }
                elseif ($ext -eq ".js") { $contentType = "application/javascript; charset=utf-8" }
                elseif ($ext -eq ".png") { $contentType = "image/png" }
                elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $contentType = "image/jpeg" }
                elseif ($ext -eq ".svg") { $contentType = "image/svg+xml" }
                elseif ($ext -eq ".ico") { $contentType = "image/x-icon" }
                
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $errMsg = "File Not Found: $urlPath"
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errMsg)
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
            $response.OutputStream.Close()
        }
    }
    catch { Write-Error $_.Exception.Message }
    finally { if ($listener.IsListening) { $listener.Stop() } }

} else {
    $ScriptPath = if ($PSCommandPath) { $PSCommandPath } else { Join-Path $PSScriptRoot "zc_server.ps1" }
    $runningServerTask = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" -HttpServer" -WindowStyle Hidden -PassThru
    Write-Host "Started ZC Operations Backend (PID: $($runningServerTask.Id)) on port 8080." -ForegroundColor Green
}
