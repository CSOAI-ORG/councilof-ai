#!/usr/bin/env python3
"""
Send 30 personalized FishKeeper.ai partnership emails via Namecheap Private Email SMTP
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import time

# SMTP Configuration for Namecheap Private Email
SMTP_SERVER = "mail.privateemail.com"
SMTP_PORT = 587  # TLS
SMTP_USERNAME = "nick@fishkeeper.ai"
SMTP_PASSWORD = "Lolpsplolen101!!"
FROM_EMAIL = "nick@fishkeeper.ai"
FROM_NAME = "Nick Templeman"

# Email targets with personalization
targets = [
    {
        "email": "info@aquariumcoop.com",
        "name": "Aquarium Co-Op Team",
        "content_reference": "Aquarium Co-Op",
        "compliment": "your approach to educating the fishkeeping community - you make complex topics accessible for everyone"
    },
    {
        "email": "contact@dustinsfishtanks.com",
        "name": "Dustin",
        "content_reference": "Dustin's Fish Tanks",
        "compliment": "your planted tank expertise and the way you make aquascaping approachable for beginners"
    },
    {
        "email": "info@bulkreefsupply.com",
        "name": "BRS Team",
        "content_reference": "BRStv",
        "compliment": "your detailed product reviews and educational content that helps reefers make informed decisions"
    },
    {
        "email": "info@marinedepot.com",
        "name": "Marine Depot Team",
        "content_reference": "your YouTube channel",
        "compliment": "your comprehensive how-to videos and the way you showcase the latest aquarium technology"
    },
    {
        "email": "info@flipaquatics.com",
        "name": "Flip Aquatics Team",
        "content_reference": "Flip Aquatics",
        "compliment": "your dedication to breeding quality shrimp and your educational content about invertebrate care"
    },
    {
        "email": "contact@aquariumadventures.co.uk",
        "name": "Graeme",
        "content_reference": "Aquarium Adventures",
        "compliment": "your honest approach to sharing both successes and failures in fishkeeping - it helps so many people learn"
    },
    {
        "email": "keepfishkeeping@gmail.com",
        "name": "KG Tropicals Team",
        "content_reference": "KG Tropicals",
        "compliment": "your engaging content and the way you connect with your audience about the fishkeeping hobby"
    },
    {
        "email": "info@buceplant.com",
        "name": "Buce Plant Team",
        "content_reference": "your blog and store",
        "compliment": "your comprehensive planted tank guides and the quality of plants you provide to the community"
    },
    {
        "email": "info@reefbuilders.com",
        "name": "Reef Builders Team",
        "content_reference": "Reef Builders",
        "compliment": "your industry authority and the way you cover both the technical and creative sides of reefkeeping"
    },
    {
        "email": "CustomerSupport@tfh.com",
        "name": "TFH Magazine Team",
        "content_reference": "Tropical Fish Hobbyist Magazine",
        "compliment": "your decades of experience educating the aquarium community through quality journalism"
    },
    {
        "email": "selectaquatics@gmail.com",
        "name": "Select Aquatics Team",
        "content_reference": "Select Aquatics",
        "compliment": "your expertise in breeding specialty fish and your commitment to quality livestock"
    },
    {
        "email": "info@majesticaquariums.com.au",
        "name": "Majestic Aquariums Team",
        "content_reference": "your YouTube channel and store",
        "compliment": "your expert advice and the way you support the Australian aquarium community"
    },
    {
        "email": "info@aquariumgardens.co.uk",
        "name": "Aquarium Gardens Team",
        "content_reference": "Aquarium Gardens",
        "compliment": "your planted tank expertise and the quality products you provide to UK aquascapers"
    },
    {
        "email": "info@2hraquarist.com",
        "name": "2Hr Aquarist Team",
        "content_reference": "The 2Hr Aquarist",
        "compliment": "your technical approach to planted tanks and your innovative product line"
    },
    {
        "email": "info@aquascapinglove.com",
        "name": "Aquascaping Love Team",
        "content_reference": "your Instagram",
        "compliment": "the stunning aquascapes you showcase and the inspiration you provide to the community"
    },
]

# Email template
def create_email_body(name, content_reference, compliment):
    return f"""Hi {name},

I'm Nick Templeman, founder of FishKeeper.ai. I've been following {content_reference} and I'm impressed by {compliment}.

I'm reaching out because we're launching FishKeeper.ai on January 1st, 2026, and I'm looking for a select group of founding partners in the aquarium community.

**What is FishKeeper.ai?**

FishKeeper.ai is an AI-powered platform that helps aquarium enthusiasts optimize their tank care. It tracks water parameters, provides personalized care recommendations based on specific setups, and helps prevent common mistakes that kill fish and waste money.

Think of it as having an expert aquarist available 24/7 - perfect for your audience whether they're beginners or experienced hobbyists.

**Why I'm Reaching Out to You**

Your audience trusts you for aquarium advice and recommendations. FishKeeper.ai is a tool that genuinely helps them succeed, and I'd love to partner with you to bring it to your community.

**Here's what makes this partnership opportunity unique:**

💰 **Ongoing Passive Income**
• 30% recurring commission for every signup you refer
• This isn't a one-time payment - you earn monthly recurring income as long as the customer stays subscribed
• Example: Refer 100 customers at £25/month = £750/month ongoing income for you

🎯 **Easy to Promote**
• Custom discount code for your audience
• Unique tracking link through Rewardful (our affiliate platform)
• No technical setup required - we handle everything

📈 **Growth Opportunities**
• Pre-launch feedback = higher commission rates (up to 40% for active contributors)
• Help shape the product - what features would your audience find most useful?
• Top performers get equity/shares in the business
• Potential to join our advisory team

🚀 **Founding Partner Benefits**
• Get in before our January 1st launch
• Exclusive early access for your audience
• Co-marketing opportunities
• Your input directly influences what we build

**How It Works**

1. Sign up for our Rewardful affiliate program (takes 2 minutes)
2. Get your custom code and link to share with your audience
3. Promote FishKeeper.ai however you like (videos, blog posts, social media, email)
4. Earn 30% recurring commission on every signup, paid monthly

It's that simple. No inventory, no customer service, no technical hassles - just share your link and earn ongoing income.

**Why This is a Win-Win**

For your audience: They get an AI tool that helps them keep healthier tanks and avoid expensive mistakes.

For you: You provide genuine value to your community while building a recurring income stream that grows over time.

For us: We get to work with trusted voices in the aquarium community who can help us make FishKeeper.ai even better.

**About Me**

I'm not just another tech founder - I'm building a fish/koi farm from scratch (check out my page @iokfarm) alongside 22 AI companies. I understand the aquarium hobby from both sides: the passion for keeping aquatic life and the technology that can make it easier.

**Next Steps**

If you're interested in becoming a founding partner, just reply to this email and I'll send you:
• Access to our Rewardful affiliate portal
• Your custom discount code and tracking link
• Marketing materials (images, copy, video clips)
• Early access to the platform

We're launching January 1st, so I'm reaching out now to give founding partners time to prepare content and get early access.

**Questions I'm happy to answer:**
• How does the Rewardful tracking system work?
• What's the average customer lifetime value?
• What marketing support do you provide?
• Can I see a demo of the platform?

Looking forward to potentially partnering with you!

Best regards,

Nick Templeman
Founder, FishKeeper.ai
nick@fishkeeper.ai
@iokfarm (Instagram - watch me build a fish/koi farm + 22 AI companies)

P.S. This is a limited opportunity - I'm only working with a select group of founding partners before launch. If you're interested, let me know soon so we can get you set up before January 1st!
"""

def send_email(to_email, to_name, subject, body):
    """Send a single email via SMTP"""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add body
        text_part = MIMEText(body, 'plain')
        msg.attach(text_part)
        
        # Connect and send
        print(f"Sending to {to_email}...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"✅ Successfully sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send to {to_email}: {str(e)}")
        return False

def main():
    """Send all emails"""
    subject = "Business Opportunity: Become a Founding Partner with FishKeeper.ai"
    
    successful = 0
    failed = 0
    
    print(f"\n🚀 Starting email campaign...")
    print(f"📧 Sending {len(targets)} emails from {FROM_EMAIL}\n")
    
    for target in targets:
        body = create_email_body(
            target["name"],
            target["content_reference"],
            target["compliment"]
        )
        
        if send_email(target["email"], target["name"], subject, body):
            successful += 1
        else:
            failed += 1
        
        # Wait 2 seconds between emails to avoid rate limiting
        time.sleep(2)
    
    print(f"\n✅ Campaign complete!")
    print(f"📊 Results: {successful} sent, {failed} failed")

if __name__ == "__main__":
    main()
