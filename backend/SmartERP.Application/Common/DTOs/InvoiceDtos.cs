using SmartERP.Domain.Enums;

namespace SmartERP.Application.Common.DTOs;

public record PostInvoiceRequest(
    string InvoiceNumber,
    Guid ShiftId,
    Guid TerminalId,
    Guid LocationId,
    Guid CashierId,
    Guid? CustomerId,
    List<InvoiceLineDto> Lines,
    List<InvoicePaymentDto> Payments,
    decimal Subtotal,
    decimal TotalDiscount,
    decimal TaxTotal,
    decimal NetTotal,
    decimal RoundingAmount,
    decimal PayableAmount,
    string? IdempotencyKey,
    DateTime FinalisedAt
);

public record InvoiceLineDto(
    Guid ProductId,
    string ProductName,
    string Barcode,
    decimal Qty,
    decimal UnitPrice,
    decimal DiscountPercent,
    decimal DiscountAmount,
    decimal TaxAmount,
    decimal LineTotal,
    bool IsFree,
    string? Note
);

public record InvoicePaymentDto(
    PaymentMethod Method,
    decimal Amount,
    string? Reference,
    string? CardType,
    string? CardLastFour,
    string? GvCode
);