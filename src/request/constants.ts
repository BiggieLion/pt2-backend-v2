export enum RequestStatus {
  CREATED = 'created', // Request created but not yet reviewed
  IN_REVIEW = 'in_review', // Request is being reviewed
  APPROVED = 'approved', // Request has been approved by supervisor
  NO_APPROVED = 'no_approved', // Request has not been approved by supervisor
  ACCEPTED = 'accepted', // Request has been accepted by requester
  REJECTED = 'rejected', // Request has been rejected by requester
  COMPLETED = 'completed', // Request process has been completed
}

export enum CreditType {
  PERSONAL = 'personal',
  CHATTEL = 'chattel',
  MORTGAGE = 'mortgage',
}
