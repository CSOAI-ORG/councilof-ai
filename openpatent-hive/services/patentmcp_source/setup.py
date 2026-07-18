"""
PatentMCP: Decentralized Invention Disclosure System
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="patentmcp",
    version="1.0.0",
    author="CSOAI - The Council for the Safety of AI",
    author_email="hello@csoai.org",
    description="MCP-Mediated, Blockchain-Anchored, HMAC-Signed Prior Art Engine",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://prooof.ai/patentmcp",
    package_dir={"": "src"},
    packages=find_packages(where="src"),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Legal Industry",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Legal",
        "Topic :: Security :: Cryptography",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    python_requires=">=3.8",
    install_requires=[
        "cryptography>=41.0.0",
    ],
    extras_require={
        "mcp": ["mcp>=1.0.0"],
        "c2pa": ["c2pa-python>=0.1.0"],
        "ots": ["opentimestamps>=0.4.0"],
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "mypy>=1.0.0",
        ],
        "all": [
            "mcp>=1.0.0",
            "c2pa-python>=0.1.0",
            "opentimestamps>=0.4.0",
            "pytest>=7.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "patentmcp=patentmcp.server:main",
        ],
    },
)
