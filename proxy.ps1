$listenPort = 3000
$targetHost = "127.0.0.1"
$targetPort = 8080

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $listenPort)
$listener.Start()

Write-Host "TCP Proxy started."
Write-Host "Access via phone at: http://192.168.80.146:$listenPort/" -ForegroundColor Cyan

while ($true) {
    if ($listener.Pending()) {
        $client = $listener.AcceptTcpClient()
        Start-ThreadJob -ArgumentList $client, $targetHost, $targetPort -ScriptBlock {
            param($client, $targetHost, $targetPort)
            try {
                $target = [System.Net.Sockets.TcpClient]::new($targetHost, $targetPort)
                $clientStream = $client.GetStream()
                $targetStream = $target.GetStream()
                
                $buffer1 = New-Object byte[] 8192
                $buffer2 = New-Object byte[] 8192
                
                while ($client.Connected -and $target.Connected) {
                    if ($clientStream.DataAvailable) {
                        $read = $clientStream.Read($buffer1, 0, $buffer1.Length)
                        if ($read -gt 0) { $targetStream.Write($buffer1, 0, $read) }
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
