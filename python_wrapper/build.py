# build.py
import os
import platform

from poetry.core.masonry.builders.sdist import SdistBuilder
from poetry.core.masonry.builders.wheel import WheelBuilder


class CustomBuilder:
    @staticmethod
    def build_sdist(sdist_path, builder):  # For source distribution
        SdistBuilder(builder._poetry, builder._env, builder._io).build(sdist_path)

    @staticmethod
    def build_wheel(wheel_path, builder):  # For wheel distribution
        system = platform.system().lower()
        machine = platform.machine().lower()

        if machine in ["x86_64", "amd64"]:
            arch = "x64"
        elif machine in ["arm64", "aarch64"]:
            arch = "arm64"
        else:
            raise RuntimeError(f"Unsupported architecture: {machine}")

        if system == "linux":
            os_name = "linux"
        elif system == "darwin":
            os_name = "macos"
        elif system == "windows":
            os_name = "windows"
        else:
            raise RuntimeError(f"Unsupported operating system: {system}")

        # Set the platform tag
        builder._poetry.config.push({"local": {"platform": f"{os_name}-{arch}"}})

        # Include the relevant binaries
        binaries_path = os.path.join(
            "src", "promptfoo", "binaries", f"{os_name}-{arch}"
        )
        builder._poetry.package.include = [
            {"path": binaries_path, "format": "glob", "include": ["*"]}
        ]

        WheelBuilder(builder._poetry, builder._env, builder._io).build(wheel_path)
