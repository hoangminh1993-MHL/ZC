$listenPort = 3000
$targetHost = "127.0.0.1"
$targetPort = 8080

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $listenPort)
$listener.Start()

Write-Host "HTTP Rewriting Proxy started on port $listenPort"

while ($true) {
    if ($listener.Pending()) {
        $client = $listener.AcceptTcpClient()
        Start-ThreadJob -ArgumentList $client, $targetHost, $targetPort -ScriptBlock {
            param($client, $targetHost, $targetPort)
            try {
                $target = [System.Net.Sockets.TcpClient]::new($targetHost, $targetPort)
                $clientStream = $client.GetStream()
                $targetStream = $target.GetStream()
                
                $buffer1 = New-Object byte[] 65536
                $buffer2 = New-Object byte[] 65536
                
                $firstPacket = $true
                
                while ($client.Connected -and $target.Connected) {
                    if ($clientStream.DataAvailable) {
                        $read = $clientStream.Read($buffer1, 0, $buffer1.Length)
                        if ($read -gt 0) {
                            if ($firstPacket) {
                                $firstPacket = $false
                                $reqString = [System.Text.Encoding]::UTF8.GetString($buffer1, 0, $read)
                                $reqString = $reqString -replace "(?m)^Host: .*$", "Host: localhost:$targetPort"
                                $modifiedBytes = [System.Text.Encoding]::UTF8.GetBytes($reqString)
                                $targetStream.Write($modifiedBytes, 0, $modifiedBytes.Length)
                            } else {
                                $targetStream.Write($buffer1, 0, $read)
                            }
                        }
                    }
                    if ($targetStream.DataAvailable) {
                        $read = $targetStream.Read($buffer2, 0, $buffer2.Length)
                        if ($read -gt 0) { $clientStream.Write($buffer2, 0, $read) }
                    }
                    Start-Sleep -Milliseconds 10
                }
            } catch {}
            finally {
                if ($client -ne $null) { $client.Close() }
                if ($target -ne $null) { $target.Close() }
            }
        }
    }
    Start-Sleep -Milliseconds 50
}
