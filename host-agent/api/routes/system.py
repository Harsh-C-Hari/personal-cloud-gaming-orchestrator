from pathlib import Path

from fastapi import APIRouter

router = APIRouter(
    prefix="/system",
    tags=["system"],
)

def create_dialog():

    import tkinter as tk
    root = tk.Tk()

    root.withdraw()

    root.attributes(
        "-topmost",
        True,
    )

    return root

@router.get("/select-file")
def select_file():

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
def select_folder():

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