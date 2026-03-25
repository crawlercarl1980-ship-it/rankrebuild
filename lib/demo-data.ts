import { WPPage } from '@/types';

export const DEMO_SITE_URL = 'https://demo.rankrebuild.com';
export const DEMO_SITE_NAME = 'Demo Dive Shop';

export const DEMO_PAGES: WPPage[] = [
  {
    id: 1,
    title: { rendered: 'Home' },
    content: { rendered: `<h1>Welcome to Demo Dive Shop</h1><p>Your local dive center for scuba certification, equipment rentals, and underwater adventures. We offer PADI courses for all skill levels, from beginner to divemaster.</p><p>Located in Charlotte, NC, we're passionate about bringing the underwater world to you. Our certified instructors have over 20 years of combined experience.</p><h2>Why Choose Us?</h2><ul><li>PADI 5-Star Dive Center</li><li>Small class sizes for personalized instruction</li><li>State-of-the-art equipment rentals</li><li>Weekend dive trips to local quarries and ocean destinations</li></ul>` },
    slug: 'home',
    link: 'https://demo.rankrebuild.com/',
    status: 'publish',
  },
  {
    id: 2,
    title: { rendered: 'About Us' },
    content: { rendered: `<h1>About Demo Dive Shop</h1><p>Founded in 2005, Demo Dive Shop has been the go-to dive center for scuba enthusiasts in the Charlotte area. Our team of passionate divers and certified instructors are dedicated to sharing the magic of the underwater world.</p><p>We believe that anyone can learn to dive, and we make the journey fun, safe, and unforgettable. Whether you're taking your first breaths underwater or heading toward your divemaster certification, we're here every step of the way.</p><h2>Our Team</h2><p>Led by head instructor Mike Johnson, a PADI Master Instructor with 15 years of experience, our team includes 6 certified instructors and 4 dive guides.</p>` },
    slug: 'about',
    link: 'https://demo.rankrebuild.com/about',
    status: 'publish',
  },
  {
    id: 3,
    title: { rendered: 'Courses' },
    content: { rendered: `<h1>Scuba Diving Courses</h1><p>From your first breath underwater to advanced certifications, we offer a full range of PADI courses.</p><h2>Open Water Diver</h2><p>The world's most popular scuba course. Learn to dive in just 3-4 days. $350 includes all materials and pool sessions.</p><h2>Advanced Open Water</h2><p>Take the next step and explore deeper dive sites. 5 adventure dives over 2 days. $299.</p><h2>Rescue Diver</h2><p>Learn to prevent and manage problems in the water. Most rewarding course divers take. $399.</p><h2>Divemaster</h2><p>Go pro! Lead certified divers and assist with courses. 6-8 week program. $899.</p>` },
    slug: 'courses',
    link: 'https://demo.rankrebuild.com/courses',
    status: 'publish',
  },
  {
    id: 4,
    title: { rendered: 'Equipment & Rentals' },
    content: { rendered: `<h1>Scuba Equipment & Rentals</h1><p>We carry the latest gear from top brands including Scubapro, Mares, and Cressi. Whether you're looking to rent for a single dive or invest in your own gear, we've got you covered.</p><h2>Rental Packages</h2><ul><li>Full gear rental (BCD, regulator, wetsuit, fins, mask): $65/day</li><li>Tank & weights only: $20/day</li><li>Wetsuit only: $25/day</li></ul><h2>Equipment Sales</h2><p>We stock a full range of new and used equipment. Trade-ins welcome. Our gear experts can help you find the perfect setup for your diving style and budget.</p><h2>Equipment Service</h2><p>Annual regulator servicing, BCD checks, and equipment inspections by certified technicians.</p>` },
    slug: 'equipment',
    link: 'https://demo.rankrebuild.com/equipment',
    status: 'publish',
  },
  {
    id: 5,
    title: { rendered: 'Contact' },
    content: { rendered: `<h1>Contact Us</h1><p>We'd love to hear from you! Whether you have questions about our courses, want to book a dive trip, or just want to chat about diving, reach out anytime.</p><h2>Get In Touch</h2><ul><li><strong>Phone:</strong> (704) 555-0123</li><li><strong>Email:</strong> info@demodiveshop.com</li><li><strong>Address:</strong> 123 Dive Lane, Charlotte, NC 28201</li></ul><h2>Hours</h2><ul><li>Monday - Friday: 10am - 7pm</li><li>Saturday: 9am - 6pm</li><li>Sunday: 10am - 4pm</li></ul><p>Pool sessions available evenings and weekends. Contact us to schedule.</p>` },
    slug: 'contact',
    link: 'https://demo.rankrebuild.com/contact',
    status: 'publish',
  },
];

export function isDemoSite(url: string): boolean {
  return url === DEMO_SITE_URL || url.includes('demo.rankrebuild.com');
}

export function getDemoPages(): WPPage[] {
  return DEMO_PAGES;
}

export function getDemoPage(pageId: number): WPPage | null {
  return DEMO_PAGES.find(p => p.id === pageId) || null;
}
