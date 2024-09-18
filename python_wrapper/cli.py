import os
import sys
import platform
import subprocess

def get_binary_path():
    system = platform.system().lower()
    machine = platform.machine().lower()

    if machine in ['x86_64', 'amd64']:
        arch = 'x64'
    elif machine in ['arm64', 'aarch64']:
        arch = 'arm64'
    else:
        raise RuntimeError(f"Unsupported architecture: {machine}")

    if system == 'linux':
        os_name = 'linux'
        binary_ext = ''
    elif system == 'darwin':
        os_name = 'macos'
        binary_ext = ''
    elif system == 'windows':
        os_name = 'windows'
        binary_ext = '.exe'
    else:
        raise RuntimeError(f"Unsupported operating system: {system}")

    binary_name = f"promptfoo-{os_name}-{arch}{binary_ext}"
    binary_path = os.path.join(os.path.dirname(__file__), 'binaries', binary_name)

    if not os.path.isfile(binary_path):
        raise FileNotFoundError(f"Binary not found for your platform: {binary_path}")

    return binary_path

def main():
    binary = get_binary_path()
    args = sys.argv[1:]
    try:
        result = subprocess.run([binary] + args, check=True)
        sys.exit(result.returncode)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()