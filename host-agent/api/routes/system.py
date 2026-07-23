from pathlib import Path

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from api.auth import get_current_user

router = APIRouter(
    prefix="/system",
    tags=["system"],
)

def create_dialog(
    current_user=Depends(
        get_current_user
    ),
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    import tkinter as tk
    root = tk.Tk()

    root.withdraw()

    root.attributes(
        "-topmost",
        True,
    )

    return root

@router.get("/select-file")
def select_file(
    current_user=Depends(
        get_current_user
    ),
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )
    
    from tkinter import filedialog
    root = create_dialog()

    try:

        file_path = filedialog.askopenfilename(
            title="Select Game Executable",
            filetypes=[
                (
                    "Executable Files",
                    "*.exe",
                )
            ],
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

    finally:

        root.destroy()

@router.get("/select-folder")
def select_folder(
    current_user=Depends(
        get_current_user
    ),
):

    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )
    
    from tkinter import filedialog
    root = create_dialog()

    try:

        folder = filedialog.askdirectory(
            title="Select Save Folder",
        )

        if not folder:

            return {
                "selected": False,
            }

        return {
            "selected": True,
            "path": folder,
        }

    finally:

        root.destroy()