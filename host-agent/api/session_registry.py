from threading import Lock

active_sessions = {}

registry_lock = Lock()