import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, ArrowLeft, Phone, Scale, FileCheck, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Badge from "@/components/Badge";


const WasteRegulations = () => {
  return (
    <>
      <SEOHead 
        title="Understanding Waste Disposal Regulations in the UK | GTS Grab Hire"
        description="Stay compliant with UK waste disposal regulations. Learn about legal requirements, licensing, and proper documentation for waste removal and disposal."
        keywords="UK waste regulations, waste disposal law, duty of care, waste carrier license, environmental compliance, waste documentation"
      />
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="container mx-auto px-4">
            <Link to="/blog" className="inline-flex items-center text-gray-200 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
            <Badge variant="yellow" className="mb-6">
              Legal & Compliance
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Understanding Waste Disposal Regulations in the UK
            </h1>
            <div className="flex items-center text-gray-200 mb-8">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="mr-6">December 10, 2023</span>
              <User className="w-5 h-5 mr-2" />
              <span className="mr-6">GTS Team</span>
              <span>8 min read</span>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="section-padding section-gradient">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              

              {/* Article Body */}
              <div className="prose prose-lg max-w-none">
                
                {/* Introduction */}
                <div className="bg-white rounded-2xl p-8 shadow-[var(--shadow-card)] mb-8">
                  <p className="text-xl text-gray-700 leading-relaxed mb-6">
                    UK waste disposal regulations are complex and carry serious legal and financial consequences for non-compliance. Understanding your obligations as a waste producer and the responsibilities of waste carriers is essential for any business or homeowner dealing with waste removal.
                  </p>
                  
                  <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                    <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-2 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                      Critical Compliance Warning
                    </h3>
                    <p className="text-gray-700">
                      Improper waste disposal can result in fines up to £50,000 and potential imprisonment. Business waste dumped illegally can lead to unlimited fines and serious reputational damage.
                    </p>
                  </div>
                </div>

                {/* Duty of Care */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6 flex items-center">
                      <Scale className="w-8 h-8 mr-3 text-[hsl(var(--gts-yellow))]" />
                      Duty of Care Obligations
                    </h2>
                    <p className="text-gray-700 leading-relaxed mb-6">
                      The Environmental Protection Act 1990 establishes the "Duty of Care" for waste, making every person in the waste chain legally responsible for ensuring proper handling and disposal. This applies to everyone from the original waste producer to the final disposal facility.
                    </p>
                    
                    <div className="space-y-6">
                      
                      {/* Waste Producer Responsibilities */}
                      <div className="bg-[hsl(var(--gts-navy))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Waste Producer Responsibilities</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Before Collection</h4>
                            <ul className="space-y-2 text-gray-700">
                              <li>• <strong>Secure Storage:</strong> Prevent waste escape or unauthorized access</li>
                              <li>• <strong>Proper Containment:</strong> Use appropriate containers for waste type</li>
                              <li>• <strong>Accurate Description:</strong> Provide detailed waste composition information</li>
                              <li>• <strong>Hazard Identification:</strong> Identify and declare any hazardous materials</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">At Collection</h4>
                            <ul className="space-y-2 text-gray-700">
                              <li>• <strong>Carrier Verification:</strong> Check waste carrier license validity</li>
                              <li>• <strong>Documentation:</strong> Complete waste transfer notes accurately</li>
                              <li>• <strong>Destination Confirmation:</strong> Verify authorized disposal facility</li>
                              <li>• <strong>Record Keeping:</strong> Maintain all waste transfer documentation</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Carrier Responsibilities */}
                      <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Waste Carrier Responsibilities</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Legal Requirements</h4>
                            <ul className="space-y-2 text-gray-700">
                              <li>• <strong>Valid License:</strong> Current Environment Agency waste carrier registration</li>
                              <li>• <strong>Insurance Coverage:</strong> Adequate public and environmental liability</li>
                              <li>• <strong>Vehicle Standards:</strong> Appropriate equipment for waste type</li>
                              <li>• <strong>Staff Training:</strong> Qualified personnel for waste handling</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Operational Duties</h4>
                            <ul className="space-y-2 text-gray-700">
                              <li>• <strong>Safe Transport:</strong> Secure waste during transportation</li>
                              <li>• <strong>Authorized Facilities:</strong> Deliver only to licensed disposal sites</li>
                              <li>• <strong>Documentation Chain:</strong> Maintain complete paper trail</li>
                              <li>• <strong>Emergency Response:</strong> Procedures for spills or accidents</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Waste Classifications */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Waste Classifications and Special Requirements</h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Different waste types have specific regulatory requirements. Proper classification is essential for legal compliance and appropriate disposal methods.
                    </p>

                    <div className="space-y-6">
                      
                      {/* Non-Hazardous Waste */}
                      <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Non-Hazardous Waste</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Household Waste</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• General household items</li>
                              <li>• Garden and kitchen waste</li>
                              <li>• Furniture and textiles</li>
                              <li>• Non-hazardous DIY materials</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Commercial Waste</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Office waste and paper</li>
                              <li>• Retail packaging materials</li>
                              <li>• Restaurant food waste</li>
                              <li>• Non-hazardous industrial waste</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Construction Waste</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Concrete, bricks, tiles</li>
                              <li>• Wood and metal materials</li>
                              <li>• Plasterboard (if uncontaminated)</li>
                              <li>• Packaging and general debris</li>
                            </ul>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded mt-4">
                          <p className="text-sm text-gray-600">
                            <strong>Documentation Required:</strong> Waste Transfer Notes for commercial waste, Waste Carrier License verification
                          </p>
                        </div>
                      </div>

                      {/* Hazardous Waste */}
                      <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4 flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                          Hazardous Waste (Special Regulations)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-3">Common Hazardous Wastes</h4>
                            <ul className="space-y-2 text-gray-700">
                              <li>• <strong>Asbestos:</strong> All forms, requires specialist removal</li>
                              <li>• <strong>Chemicals:</strong> Paints, solvents, adhesives, oils</li>
                              <li>• <strong>Electronics:</strong> WEEE items containing hazardous substances</li>
                              <li>• <strong>Batteries:</strong> All types, including vehicle batteries</li>
                              <li>• <strong>Fluorescent Tubes:</strong> Mercury-containing lighting</li>
                              <li>• <strong>Medical Waste:</strong> Pharmaceuticals, clinical items</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-3">Special Requirements</h4>
                            <ul className="space-y-2 text-gray-700">
                              <li>• <strong>Consignment Notes:</strong> Detailed hazardous waste documentation</li>
                              <li>• <strong>Licensed Carriers:</strong> Special permits for hazardous waste transport</li>
                              <li>• <strong>Authorized Facilities:</strong> Permitted hazardous waste treatment sites</li>
                              <li>• <strong>Producer Registration:</strong> Hazardous waste producers must register</li>
                              <li>• <strong>Segregation:</strong> Cannot be mixed with non-hazardous waste</li>
                              <li>• <strong>Emergency Procedures:</strong> Spill response and incident reporting</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* WEEE and Special Categories */}
                      <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Special Waste Categories</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">WEEE (Electrical)</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Computers and IT equipment</li>
                              <li>• White goods (fridges, washers)</li>
                              <li>• Small electrical items</li>
                              <li>• Lighting equipment</li>
                            </ul>
                            <p className="text-xs text-[hsl(var(--gts-dark))] mt-2 font-medium">Requires AATF treatment</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">End-of-Life Vehicles</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Cars and motorcycles</li>
                              <li>• Commercial vehicles</li>
                              <li>• Vehicle parts and fluids</li>
                              <li>• Tires and batteries</li>
                            </ul>
                            <p className="text-xs text-[hsl(var(--gts-dark))] mt-2 font-medium">ATF (Authorised Treatment Facility)</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Clinical Waste</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Healthcare waste</li>
                              <li>• Pharmaceutical waste</li>
                              <li>• Sharps and contaminated items</li>
                              <li>• Laboratory waste</li>
                            </ul>
                            <p className="text-xs text-[hsl(var(--gts-dark))] mt-2 font-medium">Special collection & treatment</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Documentation Requirements */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6 flex items-center">
                      <FileCheck className="w-8 h-8 mr-3 text-[hsl(var(--gts-success))]" />
                      Essential Documentation and Record Keeping
                    </h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Proper documentation is legally required and provides protection for all parties in the waste disposal chain. Records must be kept for minimum specified periods and be available for regulatory inspection.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      
                      <div>
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">Waste Transfer Notes (WTN)</h3>
                        <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg mb-4">
                          <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Required Information</h4>
                          <ul className="space-y-2 text-gray-700 text-sm">
                            <li>• <strong>Waste Producer:</strong> Name, address, business type</li>
                            <li>• <strong>Waste Description:</strong> Type, quantity, container details</li>
                            <li>• <strong>Carrier Details:</strong> Name, license number, vehicle details</li>
                            <li>• <strong>Destination:</strong> Facility name, address, permit details</li>
                            <li>• <strong>Transfer Date:</strong> Collection date and time</li>
                            <li>• <strong>Signatures:</strong> Both parties must sign</li>
                          </ul>
                        </div>
                        
                        <div className="section-gradient p-4 rounded-lg">
                          <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">Retention Periods</h4>
                          <ul className="space-y-1 text-sm text-gray-700">
                            <li>• <strong>Non-hazardous waste:</strong> 2 years minimum</li>
                            <li>• <strong>Hazardous waste:</strong> 3 years minimum</li>
                            <li>• <strong>WEEE documentation:</strong> 4 years minimum</li>
                            <li>• <strong>Digital copies:</strong> Acceptable if legible</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">License and Permit Verification</h3>
                        <div className="space-y-4">
                          
                          <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-4 rounded-lg">
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">Waste Carrier License</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Valid Environment Agency registration number</li>
                              <li>• Check expiry date and renewal status</li>
                              <li>• Verify license covers waste types being collected</li>
                              <li>• Online verification through EA public register</li>
                            </ul>
                          </div>

                          <div className="bg-[hsl(var(--gts-navy))] bg-opacity-10 p-4 rounded-lg">
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">Disposal Site Permits</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Environmental permit number and validity</li>
                              <li>• Authorized waste types and quantities</li>
                              <li>• Operating conditions and restrictions</li>
                              <li>• Public register verification available</li>
                            </ul>
                          </div>

                          <div className="bg-red-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2 flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                              Red Flags to Avoid
                            </h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Carriers refusing to provide license details</li>
                              <li>• Unusually low prices suggesting illegal disposal</li>
                              <li>• Vague destination descriptions</li>
                              <li>• Cash-only payment requests</li>
                              <li>• Reluctance to complete proper documentation</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Penalties and Enforcement */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Penalties and Enforcement</h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      UK environmental law enforcement has strengthened significantly, with severe penalties for waste-related offenses. Understanding potential consequences helps emphasize the importance of compliance.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Financial Penalties</h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Magistrates Court</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Fly-tipping: Up to £50,000 fine</li>
                              <li>• Unlicensed waste carriage: Up to £5,000</li>
                              <li>• Duty of care breach: Up to £5,000</li>
                              <li>• Documentation failures: Up to £300 fixed penalty</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Crown Court</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Serious environmental crimes: Unlimited fines</li>
                              <li>• Illegal waste operations: Up to 5 years imprisonment</li>
                              <li>• Corporate offenses: Director disqualification</li>
                              <li>• Asset forfeiture: Vehicles and equipment seizure</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Additional Consequences</h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Business Impact</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Reputation damage and negative publicity</li>
                              <li>• Loss of environmental certifications</li>
                              <li>• Increased insurance premiums</li>
                              <li>• Contaminated land cleanup costs</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-[hsl(var(--gts-dark))] mb-2">Regulatory Action</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Environmental permit revocation</li>
                              <li>• Operating license suspension</li>
                              <li>• Prosecution of company directors</li>
                              <li>• Ongoing regulatory monitoring</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[hsl(var(--gts-navy))] bg-opacity-10 p-6 rounded-lg mt-6">
                      <h3 className="text-lg font-semibold text-[hsl(var(--gts-dark))] mb-4">Recent Enforcement Examples</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-red-600">£2.8M</div>
                          <p className="text-sm text-gray-600">Largest illegal waste site fine (2023)</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">£420K</div>
                          <p className="text-sm text-gray-600">Waste carrier prosecution (2023)</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">5 Years</div>
                          <p className="text-sm text-gray-600">Prison sentence for illegal dumping</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Best Practices */}
                <Card className="bg-white shadow-[var(--shadow-card)] border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-[hsl(var(--gts-dark))] mb-6">Compliance Best Practices</h2>
                    
                    <p className="text-gray-700 leading-relaxed mb-6">
                      Following established best practices ensures regulatory compliance while minimizing risk and administrative burden. Professional waste management companies like GTS Grab Hire handle most compliance requirements on your behalf.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      <div>
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">For Waste Producers</h3>
                        <div className="space-y-4">
                          
                          <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-4 rounded-lg">
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">Before Collection</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Segregate waste types appropriately</li>
                              <li>• Store waste securely and safely</li>
                              <li>• Prepare accurate waste descriptions</li>
                              <li>• Research and verify waste carrier credentials</li>
                            </ul>
                          </div>

                          <div className="bg-[hsl(var(--gts-yellow))] bg-opacity-10 p-4 rounded-lg">
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">During Collection</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Check carrier license and vehicle details</li>
                              <li>• Complete waste transfer documentation fully</li>
                              <li>• Confirm destination facility details</li>
                              <li>• Keep copies of all signed documents</li>
                            </ul>
                          </div>

                          <div className="bg-[hsl(var(--gts-navy))] bg-opacity-10 p-4 rounded-lg">
                            <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">Ongoing Management</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Maintain organized document filing system</li>
                              <li>• Monitor carrier performance and compliance</li>
                              <li>• Review and audit waste management procedures</li>
                              <li>• Stay updated on regulatory changes</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-[hsl(var(--gts-dark))] mb-4">GTS Compliance Support</h3>
                        <div className="bg-[hsl(var(--gts-success))] bg-opacity-10 p-6 rounded-lg mb-4">
                          <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-3">Full Compliance Management</h4>
                          <ul className="space-y-2 text-gray-700">
                            <li>• Valid Environment Agency waste carrier license</li>
                            <li>• Comprehensive insurance coverage</li>
                            <li>• Complete documentation handling</li>
                            <li>• Authorized disposal facility network</li>
                            <li>• Digital record keeping and reporting</li>
                            <li>• Regulatory update monitoring</li>
                          </ul>
                        </div>

                        <div className="bg-white border-2 border-[hsl(var(--gts-yellow))] p-4 rounded-lg">
                          <h4 className="font-semibold text-[hsl(var(--gts-dark))] mb-2">Client Benefits</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li>• Complete legal protection and compliance</li>
                            <li>• No administrative burden for clients</li>
                            <li>• Professional guidance on waste classification</li>
                            <li>• Audit trail and documentation provision</li>
                            <li>• Regulatory expertise and support</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Call to Action */}
                <Card className="bg-[hsl(var(--gts-navy))] text-white border-0 mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold mb-6">Ensure Full Regulatory Compliance</h2>
                    <p className="text-lg text-gray-200 leading-relaxed mb-6">
                      Don't risk the serious legal and financial consequences of non-compliance. GTS Grab Hire takes full responsibility for regulatory adherence, providing you with complete peace of mind and legal protection. Our 35+ years of experience ensure your waste is handled to the highest professional and legal standards.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button asChild variant="cta" size="lg">
                        <Link to="/quote">Get Compliant Waste Solution</Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="border-[hsl(var(--gts-yellow))] text-[hsl(var(--gts-yellow))] hover:bg-[hsl(var(--gts-yellow))] hover:text-[hsl(var(--gts-dark))]">
                        <Link to="/contact">Compliance Consultation</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Contact CTA */}
              <Card className="bg-white shadow-[var(--shadow-card)] border-0 mt-12">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-[hsl(var(--gts-dark))] mb-4">
                    Need Regulatory Guidance?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Our waste management experts provide comprehensive compliance support and guidance on all aspects of UK waste disposal regulations.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="bg-[hsl(var(--gts-navy))] hover:bg-[hsl(var(--gts-navy))]/90">
                      <Link to="/contact">
                        <Phone className="w-4 h-4 mr-2" />
                        Expert Compliance Advice
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/services">Professional Services</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default WasteRegulations;