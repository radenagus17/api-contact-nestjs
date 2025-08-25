export class ContactRequest {
  name: string;
  email: string;
  phone: string;
}

export class ContactResponse {
  name: string;
  email: string;
  phone: string;
  userId?: string;
}
