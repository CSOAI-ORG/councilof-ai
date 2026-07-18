import oci,sys,os
# Try progressively smaller A1.Flex slices — smaller shapes often have capacity when 4/24 doesn't.
cfg=oci.config.from_file(); ten=cfg["tenancy"]
idc=oci.identity.IdentityClient(cfg); core=oci.core.ComputeClient(cfg); net=oci.core.VirtualNetworkClient(cfg)
pub=open(os.path.expanduser('~/.ssh/id_ed25519.pub')).read().strip()
ads=[a.name for a in idc.list_availability_domains(ten).data]
vcn=net.list_vcns(ten).data[0]; subnet=net.list_subnets(ten,vcn_id=vcn.id).data[0]
NAME='sov33-owem-a1'
for i in core.list_instances(ten).data:
    if i.display_name==NAME and i.lifecycle_state in ('RUNNING','PROVISIONING','STARTING'):
        print('ALREADY-EXISTS',i.display_name,i.lifecycle_state); sys.exit(0)
shape='VM.Standard.A1.Flex'
img=[x for x in core.list_images(ten,operating_system="Canonical Ubuntu",shape=shape).data
     if "22.04" in x.display_name and "Minimal" not in x.display_name][0]
# free-tier ceiling is 4 OCPU / 24 GB total ARM; try slices from small→large
for ocpu,mem in [(1,6),(2,12),(4,24)]:
    sc=oci.core.models.LaunchInstanceShapeConfigDetails(ocpus=ocpu,memory_in_gbs=mem)
    d=oci.core.models.LaunchInstanceDetails(compartment_id=ten,display_name=NAME,shape=shape,shape_config=sc,
      source_details=oci.core.models.InstanceSourceViaImageDetails(image_id=img.id),
      create_vnic_details=oci.core.models.CreateVnicDetails(subnet_id=subnet.id,assign_public_ip=True),
      metadata={"ssh_authorized_keys":pub})
    for ad in ads:
        d.availability_domain=ad
        try:
            inst=core.launch_instance(d).data
            print('LAUNCHED',f'{ocpu}ocpu/{mem}gb',ad.split(':')[-1],inst.id[-12:]); sys.exit(0)
        except oci.exceptions.ServiceError as e:
            print(f'{ocpu}/{mem}',ad.split(':')[-1],'->',e.code,str(e.message)[:40])
print('NO-CAPACITY-ANY-SLICE'); sys.exit(3)
