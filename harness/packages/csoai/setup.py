from setuptools import setup, find_packages
setup(
    name="csoai",
    version="1.0.0",
    packages=find_packages(),
    install_requires=["requests", "pynacl"],
    description="Python SDK for CSOAI GSPC framework",
)
