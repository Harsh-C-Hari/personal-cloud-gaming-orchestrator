import json
import subprocess
from pathlib import Path
import urllib3
import requests
from requests.auth import HTTPBasicAuth


urllib3.disable_warnings(
    urllib3.exceptions.InsecureRequestWarning
)

def load_config():
    config_file = Path("config.json")

    if not config_file.exists():
        return {}

    with config_file.open(
        "r",
        encoding="utf-8",
    ) as file:
        return json.load(file)


def get_sunshine_config():
    config = load_config()

    return config.get(
        "sunshine",
        {},
    )


def is_sunshine_process_running() -> bool:
    try:
        result = subprocess.run(
            [
                "tasklist",
                "/FI",
                "IMAGENAME eq sunshine.exe",
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )

        return "sunshine.exe" in result.stdout.lower()

    except Exception:
        return False


def get_sunshine_clients():
    sunshine = get_sunshine_config()

    api_url = sunshine.get(
        "api_url",
        "https://localhost:47990",
    ).rstrip("/")

    username = sunshine.get("username", "")
    password = sunshine.get("password", "")
    verify_ssl = sunshine.get("verify_ssl", False)

    if not username or not password:
        return {
            "reachable": False,
            "clients": [],
            "error": "Sunshine username/password not configured",
        }

    try:
        response = requests.get(
            f"{api_url}/api/clients/list",
            auth=HTTPBasicAuth(
                username,
                password,
            ),
            verify=verify_ssl,
            timeout=5,
        )

        if response.status_code != 200:
            return {
                "reachable": False,
                "clients": [],
                "error": f"Sunshine API returned {response.status_code}",
            }

        data = response.json()

        return {
            "reachable": bool(data.get("status")),
            "clients": data.get("named_certs", []),
            "error": "",
        }

    except Exception as error:
        return {
            "reachable": False,
            "clients": [],
            "error": str(error),
        }

def get_sunshine_apps():
    sunshine = get_sunshine_config()

    api_url = sunshine.get(
        "api_url",
        "https://localhost:47990",
    ).rstrip("/")

    username = sunshine.get("username", "")
    password = sunshine.get("password", "")
    verify_ssl = sunshine.get("verify_ssl", False)

    if not username or not password:
        return {
            "reachable": False,
            "apps": [],
            "error": "Sunshine username/password not configured",
        }

    try:
        response = requests.get(
            f"{api_url}/api/apps",
            auth=HTTPBasicAuth(
                username,
                password,
            ),
            verify=verify_ssl,
            timeout=5,
        )

        if response.status_code != 200:
            return {
                "reachable": False,
                "apps": [],
                "error": f"Sunshine apps API returned {response.status_code}",
            }

        data = response.json()

        return {
            "reachable": True,
            "apps": data.get("apps", []),
            "error": "",
        }

    except Exception as error:
        return {
            "reachable": False,
            "apps": [],
            "error": str(error),
        }

def get_sunshine_auth():
    sunshine = get_sunshine_config()

    username = sunshine.get("username", "")
    password = sunshine.get("password", "")

    return (
        username,
        password,
    )

def pair_client(
    pin: str,
):
    sunshine = get_sunshine_config()

    api_url = sunshine.get(
        "api_url",
        "https://localhost:47990",
    ).rstrip("/")

    username, password = (
        get_sunshine_auth()
    )

    verify_ssl = sunshine.get(
        "verify_ssl",
        False,
    )

    try:
        response = requests.post(
            f"{api_url}/api/pin",
            json={
                "pin": pin,
            },
            auth=HTTPBasicAuth(
                username,
                password,
            ),
            verify=verify_ssl,
            timeout=10,
        )

        success = (
            response.status_code == 200
        )

        return {
            "success": success,
            "status_code":
                response.status_code,
            "message":
                response.text,
        }

    except Exception as error:
        return {
            "success": False,
            "status_code": None,
            "message": str(error),
        }

def unpair_client(
    uuid: str,
):
    sunshine = get_sunshine_config()

    api_url = sunshine.get(
        "api_url",
        "https://localhost:47990",
    ).rstrip("/")

    username, password = (
        get_sunshine_auth()
    )

    verify_ssl = sunshine.get(
        "verify_ssl",
        False,
    )

    try:
        response = requests.post(
            f"{api_url}/api/clients/unpair",
            json={
                "uuid": uuid,
            },
            auth=HTTPBasicAuth(
                username,
                password,
            ),
            verify=verify_ssl,
            timeout=10,
        )

        success = (
            response.status_code == 200
        )

        return {
            "success": success,
            "status_code":
                response.status_code,
            "message":
                response.text,
        }

    except Exception as error:
        return {
            "success": False,
            "status_code": None,
            "message": str(error),
        }

def unpair_all_clients():
    sunshine = get_sunshine_config()

    api_url = sunshine.get(
        "api_url",
        "https://localhost:47990",
    ).rstrip("/")

    username, password = (
        get_sunshine_auth()
    )

    verify_ssl = sunshine.get(
        "verify_ssl",
        False,
    )

    try:
        response = requests.post(
            f"{api_url}/api/clients/unpair-all",
            auth=HTTPBasicAuth(
                username,
                password,
            ),
            verify=verify_ssl,
            timeout=10,
        )

        success = (
            response.status_code == 200
        )

        return {
            "success": success,
            "status_code":
                response.status_code,
            "message":
                response.text,
        }

    except Exception as error:
        return {
            "success": False,
            "status_code": None,
            "message": str(error),
        }