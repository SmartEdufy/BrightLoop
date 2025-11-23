
export const MASTER_CLASS_LIST = ['12th', '11th', '10th', '9th', '8th', '7th', '6th', '5th', '4th', '3rd', '2nd', '1st', 'UKG', 'LKG', 'Nursery', 'Pre-Nursery'];

export enum UserRole {
  ADMIN = 'ADMIN', // System admin
  SCHOOL_ADMIN = 'SCHOOL_ADMIN' // School principal/headmaster
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
  schoolId?: string; // ID of the school document
}

export enum SchoolType {
  PRIMARY = 'Primary',
  MIDDLE = 'Middle',
  SECONDARY = 'Secondary',
  HIGHER_SECONDARY = 'Higher Secondary'
}

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface SchoolProfile {
  id: string;
  ownerUid: string;
  name: string;
  zone: string;
  district: string;
  state: string;
  address: string;
  udiseCode: string;
  type: SchoolType;
  management?: 'GOVT' | 'PRIVATE'; // New field for Private vs Government
  regNo?: string; // New field for Registration Number (Private schools)
  headmasterName: string;
  watermarkText?: string; // Custom watermark text for documents
  slug: string; // For the subdomain/url part
  signatureUrl?: string; // Data URL or Storage URL
  createdAt?: FirestoreTimestamp | Date;
  rollStatementClasses?: string[]; // Configured classes for reports
  
  // Website specific settings
  websiteConfig: {
    welcomeMessage: string;
    abbreviation: string;
    heroImageUrl?: string;
    logoUrl?: string; // School Logo
    aboutText?: string; // About Us Section
    facilities?: string[]; // Array of selected facilities
    socialLinks?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
    };
    admissionOpen?: boolean;
    
    themeColor: string;
    notifications: Array<{id: string, title: string, date: string, link?: string}>;
    contactEmail: string;
    contactPhone: string;
  }
}

export interface Student {
  id?: string;
  schoolId: string;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  fatherName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  address: string;
  phone: string;
  admissionNo?: string;
  createdAt: string;
}