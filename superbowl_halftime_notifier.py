#!/usr/bin/env python3
"""
Super Bowl LX Halftime Show Notifier

Notifies you when Bad Bunny's halftime show at Super Bowl LX (Feb 8, 2026)
is about to start. Sends desktop notifications at 30 min, 15 min, 5 min,
and 1 min before the estimated start, plus when it begins.

Usage:
    python3 superbowl_halftime_notifier.py [--halftime-time "2026-02-08 20:15"]

The default estimated halftime start is 8:15 PM ET (between the commonly
reported 8:00-8:30 PM ET window).
"""

import argparse
import signal
import sys
import time
from datetime import datetime, timezone, timedelta

ET = timezone(timedelta(hours=-5))

# Super Bowl LX details
SUPERBOWL_INFO = {
    "event": "Super Bowl LX",
    "date": "February 8, 2026",
    "location": "Levi's Stadium, Santa Clara, CA",
    "matchup": "Seattle Seahawks vs New England Patriots",
    "halftime_performer": "Bad Bunny",
    "broadcast": "NBC / Peacock",
}

DEFAULT_HALFTIME = datetime(2026, 2, 8, 20, 15, 0, tzinfo=ET)

# (minutes_before, message, been_sent)
ALERTS = [
    (30, "30 minutes until the halftime show!"),
    (15, "15 minutes until halftime! Get your snacks ready."),
    (5,  "5 minutes! Bad Bunny takes the stage soon."),
    (1,  "1 minute! The halftime show is about to start!"),
    (0,  "It's HALFTIME! Bad Bunny is on NOW!"),
]

CLEAR = "\033[2J\033[H"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
GREEN = "\033[32m"
MAGENTA = "\033[35m"
RED = "\033[31m"


def send_notification(title: str, message: str) -> None:
    """Send a desktop notification, falling back to terminal bell."""
    try:
        from plyer import notification
        notification.notify(
            title=title,
            message=message,
            timeout=10,
        )
    except Exception:
        pass
    # Also ring the terminal bell
    print("\a", end="", flush=True)


def format_countdown(seconds: float) -> str:
    """Format seconds into a human-readable countdown string."""
    if seconds <= 0:
        return "NOW!"
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    parts = []
    if h > 0:
        parts.append(f"{h}h")
    if m > 0 or h > 0:
        parts.append(f"{m:02d}m")
    parts.append(f"{s:02d}s")
    return " ".join(parts)


def big_time(countdown_str: str) -> str:
    """Return a large-format countdown display."""
    return f"{BOLD}{CYAN}{countdown_str}{RESET}"


def render(halftime_time: datetime, alerts_sent: set, now: datetime) -> str:
    """Render the full terminal UI."""
    diff = (halftime_time - now).total_seconds()
    countdown_str = format_countdown(diff)

    lines = [CLEAR]
    lines.append(f"{BOLD}{MAGENTA}{'=' * 56}{RESET}")
    lines.append(f"{BOLD}{MAGENTA}   SUPER BOWL LX  -  HALFTIME SHOW NOTIFIER{RESET}")
    lines.append(f"{BOLD}{MAGENTA}{'=' * 56}{RESET}")
    lines.append("")
    lines.append(f"  {DIM}Event:{RESET}     {SUPERBOWL_INFO['event']}")
    lines.append(f"  {DIM}Matchup:{RESET}   {SUPERBOWL_INFO['matchup']}")
    lines.append(f"  {DIM}Performer:{RESET} {BOLD}{SUPERBOWL_INFO['halftime_performer']}{RESET}")
    lines.append(f"  {DIM}Where:{RESET}     {SUPERBOWL_INFO['location']}")
    lines.append(f"  {DIM}Watch on:{RESET}  {SUPERBOWL_INFO['broadcast']}")
    lines.append("")
    lines.append(f"  {DIM}Halftime estimated at:{RESET} {YELLOW}{halftime_time.strftime('%I:%M %p ET')}{RESET}")
    lines.append(f"  {DIM}Current time:{RESET}          {now.strftime('%I:%M:%S %p ET')}")
    lines.append("")

    if diff > 0:
        lines.append(f"  {DIM}Halftime starts in:{RESET}")
        lines.append(f"         {big_time(countdown_str)}")
    else:
        elapsed = abs(diff)
        if elapsed < 780:  # ~13 min show
            lines.append(f"  {GREEN}{BOLD}  HALFTIME SHOW IS LIVE!{RESET}")
            lines.append(f"  {DIM}Elapsed:{RESET} {GREEN}{format_countdown(elapsed)}{RESET}")
        else:
            lines.append(f"  {DIM}The halftime show has ended.{RESET}")

    lines.append("")

    # Show notification log
    lines.append(f"  {DIM}Notifications:{RESET}")
    for minutes, msg in ALERTS:
        marker = f"{GREEN}>> sent{RESET}" if minutes in alerts_sent else f"{DIM}   pending{RESET}"
        lines.append(f"    {marker}  {DIM}T-{minutes:2d}min:{RESET} {msg}")

    lines.append("")
    lines.append(f"  {DIM}Press Ctrl+C to quit{RESET}")
    lines.append(f"{BOLD}{MAGENTA}{'=' * 56}{RESET}")

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Super Bowl LX Halftime Notifier")
    parser.add_argument(
        "--halftime-time",
        type=str,
        default=None,
        help='Estimated halftime start in ET, e.g. "2026-02-08 20:15"',
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Test mode: set halftime to 1 minute from now",
    )
    args = parser.parse_args()

    if args.test:
        halftime_time = datetime.now(ET) + timedelta(minutes=1)
        print(f"Test mode: halftime set to {halftime_time.strftime('%I:%M:%S %p ET')}")
    elif args.halftime_time:
        naive = datetime.strptime(args.halftime_time, "%Y-%m-%d %H:%M")
        halftime_time = naive.replace(tzinfo=ET)
    else:
        halftime_time = DEFAULT_HALFTIME

    alerts_sent: set[int] = set()

    def handle_exit(sig, frame):
        print(f"\n{RESET}Goodbye! Enjoy the game!")
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_exit)

    while True:
        now = datetime.now(ET)
        diff = (halftime_time - now).total_seconds()

        # Check alerts
        for minutes, msg in ALERTS:
            if minutes not in alerts_sent and diff <= minutes * 60:
                alerts_sent.add(minutes)
                send_notification(
                    f"Super Bowl LX - Halftime",
                    msg,
                )

        output = render(halftime_time, alerts_sent, now)
        print(output, flush=True)

        # After show is well over, stop refreshing as fast
        if diff < -900:
            time.sleep(30)
        else:
            time.sleep(1)


if __name__ == "__main__":
    main()
