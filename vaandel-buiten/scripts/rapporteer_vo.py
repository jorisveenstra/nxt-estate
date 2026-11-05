"""Rapporteert de werkelijk gemaakte ElevenLabs-voice-overs (request-id + character-cost) aan de portal. Idempotent per request-id."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from portal_bridge import PortalBridge
ROOT = Path(__file__).resolve().parent.parent
def maak_bridge(url, token, run_id):
    b = PortalBridge(url, token, ["https://portal.nxt-estate.com"]); b.run_id = run_id; return b
