namespace SmartERP.Domain.Enums;

public enum UserRole { Cashier, SeniorCashier, Supervisor, Manager, Admin }
public enum ShiftStatus { Open, Closed }
public enum InvoiceStatus { Paid, Voided, Refunded }
public enum BillLineStatus { Active, Voided }
public enum PaymentMethod { Cash, Card, Cheque, Credit, GiftVoucher, LoyaltyPoints, MobileWallet, BankTransfer, Advance }
public enum CustomerStatus { Active, Suspended, Blacklisted }
public enum CustomerType { Retail, Wholesale, Trade }
public enum ReturnReason { NormalReturn, Defective, WrongItem, CustomerChangedMind, Damage }
public enum RefundMethod { Cash, Card, CreditNote, LoyaltyPoints }
public enum SyncStatus { Pending, Synced, Failed }
public enum PosMode { Retail, Restaurant, Pharmacy, Supermarket }