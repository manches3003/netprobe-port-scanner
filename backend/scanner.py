import socket
import concurrent.futures
from datetime import datetime

# ── Common ports and their services ────────────────────────────
COMMON_PORTS = {
    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
    53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
    443: "HTTPS", 445: "SMB", 3306: "MySQL", 3389: "RDP",
    5432: "PostgreSQL", 5900: "VNC", 6379: "Redis",
    8080: "HTTP-Alt", 8443: "HTTPS-Alt", 27017: "MongoDB",
    6443: "Kubernetes", 2375: "Docker", 9200: "Elasticsearch"
}

# ── Dangerous ports ─────────────────────────────────────────────
DANGEROUS_PORTS = {
    23:    "Telnet sends data in plaintext — easily intercepted",
    445:   "SMB — commonly exploited by ransomware (WannaCry)",
    3389:  "RDP — frequent target for brute force attacks",
    5900:  "VNC — remote desktop, often misconfigured",
    2375:  "Docker API exposed — full container takeover possible",
    6379:  "Redis without auth — data theft risk",
    27017: "MongoDB without auth — database exposed",
    9200:  "Elasticsearch — sensitive data exposure risk",
    21:    "FTP — sends credentials in plaintext",
}


def get_port_risk(port):
    if port in DANGEROUS_PORTS:
        return "HIGH", DANGEROUS_PORTS[port]
    elif port in [25, 110, 143, 5432, 3306]:
        return "MEDIUM", "Sensitive service — ensure proper authentication"
    elif port in [80, 443, 8080, 8443, 53]:
        return "LOW", "Common web/DNS service — generally safe if patched"
    else:
        return "INFO", "Non-standard port — verify if needed"


def get_service_name(port):
    if port in COMMON_PORTS:
        return COMMON_PORTS[port]
    try:
        return socket.getservbyport(port)
    except Exception:
        return "Unknown"


def scan_port(host, port, timeout=1.0):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        if result == 0:
            return port
    except Exception:
        pass
    return None


def scan_ports_fast(host, ports, max_workers=100):
    open_ports = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(scan_port, host, port): port for port in ports}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result is not None:
                open_ports.append(result)
    return sorted(open_ports)


def get_banner(host, port, timeout=2.0):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect((host, port))
        sock.send(b"HEAD / HTTP/1.0\r\n\r\n")
        banner = sock.recv(1024).decode("utf-8", errors="ignore").strip()
        sock.close()
        return banner[:200] if banner else ""
    except Exception:
        return ""


def resolve_host(target):
    try:
        return socket.gethostbyname(target)
    except socket.gaierror:
        raise ValueError(f"Cannot resolve hostname: {target}")


def calculate_risk_score(open_ports_data):
    if not open_ports_data:
        return 0, "LOW"
    score = 0
    for p in open_ports_data:
        risk = p.get("risk_level", "INFO")
        if risk == "HIGH":    score += 30
        elif risk == "MEDIUM": score += 15
        elif risk == "LOW":    score += 5
        else:                  score += 2
    score = min(score, 100)
    if score >= 70:   return score, "CRITICAL"
    elif score >= 40: return score, "HIGH"
    elif score >= 20: return score, "MEDIUM"
    else:             return score, "LOW"


def run_scan(target, scan_type="common"):
    start_time = datetime.now()

    ip = resolve_host(target)

    if scan_type == "common":
        ports = sorted(set(list(COMMON_PORTS.keys()) + list(range(1, 100))))
    elif scan_type == "full":
        ports = list(range(1, 1025))
    else:
        ports = list(COMMON_PORTS.keys())

    open_port_numbers = scan_ports_fast(ip, ports)

    open_ports_data = []
    high_risk_count = medium_risk_count = 0

    for port in open_port_numbers:
        service = get_service_name(port)
        risk_level, risk_reason = get_port_risk(port)
        banner = get_banner(ip, port)

        if risk_level == "HIGH":   high_risk_count += 1
        elif risk_level == "MEDIUM": medium_risk_count += 1

        open_ports_data.append({
            "port": port,
            "service": service,
            "risk_level": risk_level,
            "risk_reason": risk_reason,
            "banner": banner,
            "state": "open"
        })

    risk_score, risk_rating = calculate_risk_score(open_ports_data)

    recommendations = []
    for p in open_ports_data:
        if p["risk_level"] == "HIGH":
            recommendations.append(f"🔴 Close port {p['port']} ({p['service']}) — {p['risk_reason']}")
        elif p["risk_level"] == "MEDIUM":
            recommendations.append(f"🟠 Secure port {p['port']} ({p['service']}) — {p['risk_reason']}")
    if not recommendations:
        recommendations.append("✅ No critical vulnerabilities detected. Keep services updated.")

    duration = round((datetime.now() - start_time).total_seconds(), 2)

    return {
        "target": target,
        "ip": ip,
        "scan_type": scan_type,
        "total_ports_scanned": len(ports),
        "open_ports_count": len(open_ports_data),
        "open_ports": open_ports_data,
        "risk_score": risk_score,
        "risk_rating": risk_rating,
        "high_risk_count": high_risk_count,
        "medium_risk_count": medium_risk_count,
        "recommendations": recommendations,
        "scan_duration": duration,
        "timestamp": start_time.strftime("%Y-%m-%d %H:%M:%S")
    }