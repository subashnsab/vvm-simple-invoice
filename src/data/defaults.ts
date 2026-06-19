import { BusinessSettings, Product, Invoice, Customer, Vendor, PurchaseBill } from '../types.ts';

export const defaultBusinessSettings: BusinessSettings = {
  name: "Saravana Stores & Co",
  gstin: "33AAAAA1111A1Z1", // Sample Tamil Nadu GSTIN
  address: "124, Ranganathan Street, T. Nagar, Chennai, Tamil Nadu - 600017",
  phone: "+91 98765 43210",
  email: "billing@saravanastores.co",
  bankName: "State Bank of India",
  accountNumber: "123456789012",
  ifscCode: "SBIN0000800",
  upiId: "saravana@upi",
  currency: "₹"
};

export const defaultProducts: Product[] = [
  {
    id: "prod-1",
    name: "Classic Silk Saree",
    description: "Kanchipuram handwoven gold zari silk saree",
    price: 4500,
    taxPercent: 5 // Clothes below or above 1000 can be 5% / 12% standard GST
  },
  {
    id: "prod-2",
    name: "Designer Kurti",
    description: "Cotton printed women's designer wear",
    price: 850,
    taxPercent: 5
  },
  {
    id: "prod-3",
    name: "Gold Plated Necklace Set",
    description: "Ethnic traditional bridal jewelry",
    price: 2400,
    taxPercent: 3 // Gold is 3% GST in India
  },
  {
    id: "prod-4",
    name: "Leather Men's Wallet",
    description: "Genuine brown bi-fold leather wallet",
    price: 1200,
    taxPercent: 12
  },
  {
    id: "prod-5",
    name: "Smart Watch Elite",
    description: "Bluetooth calling fitness smartwatch with AMOLED display",
    price: 3499,
    taxPercent: 18 // Electronics standard is 18% GST
  },
  {
    id: "prod-6",
    name: "Silk Dhoti & Shirt Combo",
    description: "Traditional festival pure cotton set",
    price: 1800,
    taxPercent: 5
  }
];

export const defaultCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Subash Chandran",
    phone: "9845612347",
    email: "subashnsab@gmail.com",
    address: "Apt 4B, Ruby Vista, Velachery, Chennai, TN - 600042"
  },
  {
    id: "cust-2",
    name: "Anjali Devi",
    phone: "9123456780",
    email: "anjali.devi@yahoo.com",
    address: "14, West Mada Street, Mylapore, Chennai, TN - 600004"
  },
  {
    id: "cust-3",
    name: "Rajesh Kumar",
    phone: "8765432109",
    email: "rajesh.kovai@gmail.com",
    address: "78, Cross Cut Road, Gandhipuram, Coimbatore, TN - 641012"
  }
];

export const defaultInvoices: Invoice[] = [
  {
    id: "INV-2026-001",
    invoiceNumber: 1,
    createdAt: "2026-06-18T10:30:00Z",
    customerName: "Subash Chandran",
    customerPhone: "9845612347",
    customerEmail: "subashnsab@gmail.com",
    customerAddress: "Apt 4B, Ruby Vista, Velachery, Chennai, TN - 600042",
    items: [
      {
        id: "item-1",
        name: "Classic Silk Saree",
        description: "Kanchipuram handwoven gold zari silk saree",
        quantity: 2,
        price: 4500,
        taxPercent: 5
      },
      {
        id: "item-2",
        name: "Gold Plated Necklace Set",
        description: "Ethnic traditional bridal jewelry",
        quantity: 1,
        price: 2400,
        taxPercent: 3
      }
    ],
    subtotal: 11400,
    discount: 500,
    taxTotal: 522, // 5% of 9000 is 450, 3% of 2400 is 72. Total tax: 522
    grandTotal: 11422, // 11400 subtotal - 500 discount + 522 tax
    status: 'Paid',
    paymentMethod: 'UPI',
    notes: "Thank you for shopping with us! Standard exchange policy of 7 days applies.",
    synced: false
  },
  {
    id: "INV-2026-002",
    invoiceNumber: 2,
    createdAt: "2026-06-19T02:15:00Z",
    customerName: "Anjali Devi",
    customerPhone: "9123456780",
    customerEmail: "anjali.devi@yahoo.com",
    customerAddress: "14, West Mada Street, Mylapore, Chennai, TN - 600004",
    items: [
      {
        id: "item-3",
        name: "Smart Watch Elite",
        description: "Bluetooth calling fitness smartwatch with AMOLED display",
        quantity: 1,
        price: 3499,
        taxPercent: 18
      },
      {
        id: "item-4",
        name: "Designer Kurti",
        description: "Cotton printed women's designer wear",
        quantity: 3,
        price: 850,
        taxPercent: 5
      }
    ],
    subtotal: 6049,
    discount: 200,
    taxTotal: 757.32, // 18% of 3499 is 629.82, 5% of 2550 is 127.5. Total is 757.32
    grandTotal: 6606.32,
    status: 'Pending',
    paymentMethod: 'Bank Transfer',
    notes: "Awaiting final settlement.",
    synced: false
  }
];

export const defaultVendors: Vendor[] = [
  {
    id: "vend-1",
    name: "Sri Balaji Tex",
    phone: "9150123456",
    email: "balajitex@yahoo.com",
    address: "52, Elango Street, Erode, Tamil Nadu - 638001",
    gstin: "33BALAJ1234T1Z3"
  },
  {
    id: "vend-2",
    name: "Chennai Jewelry Crafts",
    phone: "9444055522",
    email: "chennai_crafts@gmail.com",
    address: "15, NSC Bose Road, Sowcarpet, Chennai - 600079",
    gstin: "33CJCRA4567J1ZC"
  }
];

export const defaultPurchaseInvoices: PurchaseBill[] = [
  {
    id: "PUR-2026-001",
    billNumber: 1,
    createdAt: "2026-06-15T12:00:00Z",
    vendorName: "Sri Balaji Tex",
    vendorPhone: "9150123456",
    vendorEmail: "balajitex@yahoo.com",
    vendorAddress: "52, Elango Street, Erode, Tamil Nadu - 638001",
    vendorGstin: "33BALAJ1234T1Z3",
    items: [
      {
        id: "puritem-1",
        name: "Classic Silk Saree",
        description: "Bulk raw materials / silk yarn & zari border bundles",
        quantity: 20,
        price: 3200,
        taxPercent: 5,
        unit: 'pcs'
      }
    ],
    subtotal: 64000,
    discount: 1200,
    taxTotal: 3200,
    grandTotal: 66000,
    roundOff: 0,
    status: 'Paid',
    paymentMethod: 'Bank Transfer',
    notes: "Stock delivery complete. Transaction cleared successfully."
  },
  {
    id: "PUR-2026-002",
    billNumber: 2,
    createdAt: "2026-06-18T09:00:00Z",
    vendorName: "Chennai Jewelry Crafts",
    vendorPhone: "9444055522",
    vendorEmail: "chennai_crafts@gmail.com",
    vendorAddress: "15, NSC Bose Road, Sowcarpet, Chennai - 600079",
    vendorGstin: "33CJCRA4567J1ZC",
    items: [
      {
        id: "puritem-2",
        name: "Gold Plated Necklace Set",
        description: "Traditional ornaments for festive showcase placement",
        quantity: 5,
        price: 1600,
        taxPercent: 3,
        unit: 'pcs'
      }
    ],
    subtotal: 8000,
    discount: 240,
    taxTotal: 240,
    grandTotal: 8000,
    roundOff: 0,
    status: 'Pending',
    paymentMethod: 'Card',
    notes: "Partially received. Dues clear on remainder arrival."
  }
];

