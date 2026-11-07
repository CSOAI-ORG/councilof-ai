SUMMARY = "Read-only GSPC OpenBMC Redfish evidence collector"
DESCRIPTION = "Bounded GET-only Redfish collector; measurement, never certification"
HOMEPAGE = "https://councilof.ai"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://LICENSE;md5=647ff77ef65b562b9ea9d33019dd48e9"

SRC_URI = "file://gspc-openbmc-collector file://LICENSE"
S = "${WORKDIR}"
RDEPENDS:${PN} = "python3-core python3-crypt python3-datetime python3-io python3-json python3-netclient"

do_install() {
    install -d ${D}${bindir}
    install -m 0755 ${WORKDIR}/gspc-openbmc-collector ${D}${bindir}/gspc-openbmc-collector
}
