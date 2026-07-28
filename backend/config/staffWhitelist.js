// Authorized staff emails - only these emails can register as staff
const AUTHORIZED_STAFF_EMAILS = [
  'staff@test.com',
  'admin@sharelane.com',
  'john@sharelane.com', // Add john's email if needed
  'newstaff@test.com', // Test email
  // Add more authorized staff emails here
];

// Check if email is authorized for staff role
const isAuthorizedStaff = (email) => {
  return AUTHORIZED_STAFF_EMAILS.includes(email.toLowerCase());
};

module.exports = {
  AUTHORIZED_STAFF_EMAILS,
  isAuthorizedStaff
};
