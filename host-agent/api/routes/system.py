import asyncio
import ctypes
from pathlib import Path

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from api.auth import get_current_user

router = APIRouter(
    prefix="/system",
    tags=["system"],
)


def _apply_dpi_awareness():
    
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except (AttributeError, OSError):
        try:
            ctypes.windll.user32.SetProcessDPIAware()
        except (AttributeError, OSError):
            pass
            
    try:
        import tkinter as tk
        from tkinter import filedialog
    except ImportError:
        pass

_apply_dpi_awareness()



def _select_file_sync():

    import tkinter as tk
    from tkinter import filedialog
    import os

    root = tk.Tk()

    root.withdraw()

    root.lift()
    root.focus_force() 
    
    root.attributes(
        "-topmost",
        True,
    )

    initial_dir = os.environ.get("USERPROFILE", "C:\\")

    try:

        file_path = filedialog.askopenfilename(
            title="Select Executable",
            filetypes=[
                (
                    "Executable Files",
                    "*.exe",
                )
            ],
        )

    finally:

        root.destroy()

    return file_path


def _select_folder_sync():
    
    import tkinter as tk
    from tkinter import filedialog

    root = tk.Tk()

    root.withdraw()

    root.lift()
    root.focus_force() 
    
    root.attributes(
        "-topmost",
        True,
    )

    try:

        folder = filedialog.askdirectory(
            title="Select Folder",
        )

    finally:

        root.destroy()

    return folder


@router.get("/select-file")
async def select_file(
    current_user=Depends(
        get_current_user
    ),
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    file_path = await asyncio.to_thread(
        _select_file_sync
    )

    if not file_path:

        return {
            "selected": False,
        }

    path = Path(file_path)

    return {
        "selected": True,
        "path": str(path),
        "name": path.name,
    }


@router.get("/select-folder")
async def select_folder(
    current_user=Depends(
        get_current_user
    ),
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    folder = await asyncio.to_thread(
        _select_folder_sync
    )

    if not folder:

        return {
            "selected": False,
        }

    return {
        "selected": True,
        "path": folder,
    }