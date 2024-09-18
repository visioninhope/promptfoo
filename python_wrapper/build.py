"""Custom builder module for creating platform-specific wheel distributions.

This module provides a CustomBuilder class that extends Poetry's build process
to create platform-specific wheel distributions. It includes methods for building
source distributions (sdist) and wheel distributions.

Typical usage example:

  builder = CustomBuilder()
  builder.build_wheel(wheel_path, poetry_builder)
"""

import os
import platform

from poetry.core.masonry.builders.sdist import SdistBuilder
from poetry.core.masonry.builders.wheel import WheelBuilder


class CustomBuilder:
    """Custom builder for creating platform-specific wheel distributions."""

    @staticmethod
    def build_sdist(sdist_path: str, builder: object) -> None:
        """Builds a source distribution.

        Args:
            sdist_path: Path where the source distribution will be built.
            builder: The Poetry builder object.
        """
        SdistBuilder(builder._poetry, builder._env, builder._io).build(sdist_path)

    @staticmethod
    def build_wheel(wheel_path: str, builder: object) -> None:
        """Builds a wheel distribution for the current platform and architecture.

        Args:
            wheel_path: Path where the wheel will be built.
            builder: The Poetry builder object.

        Raises:
            RuntimeError: If the current system or architecture is not supported.
        """
        system = platform.system().lower()
        machine = platform.machine().lower()

        # Determine the architecture
        if machine in ["x86_64", "amd64"]:
            arch = "x64"
        elif machine in ["arm64", "aarch64"]:
            arch = "arm64"
        else:
            raise RuntimeError(f"Unsupported architecture: {machine}")

        # Determine the operating system
        if system == "linux":
            os_name = "linux"
        elif system == "darwin":
            os_name = "macos"
        elif system == "windows":
            os_name = "windows"
        else:
            raise RuntimeError(f"Unsupported operating system: {system}")

        # Set the platform tag in the Poetry configuration
        builder._poetry.config.push({"local": {"platform": f"{os_name}-{arch}"}})

        # Include the relevant binaries for the current platform
        binaries_path = os.path.join(
            "src", "promptfoo", "binaries", f"{os_name}-{arch}"
        )
        builder._poetry.package.include = [
            {"path": binaries_path, "format": "glob", "include": ["*"]}
        ]

        # Build the wheel using Poetry's WheelBuilder
        WheelBuilder(builder._poetry, builder._env, builder._io).build(wheel_path)
