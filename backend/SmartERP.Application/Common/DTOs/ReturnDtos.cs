using SmartERP.Domain.Enums;

namespace SmartERP.Application.Common.DTOs;

public record PostReturnRequest(
    string OriginalInvoiceNumber,
    Guid ShiftId,
    Guid CashierId,
    Guid TerminalId,
    Guid LocationId,
    RefundMethod RefundMethod,
    decimal TotalRefund,
    List<ReturnLineDto> Lines,
    DateTime ReturnedAt
);

public record ReturnLineDto(
    Guid OriginalLineId,
    Guid ProductId,
    string ProductName,
    decimal ReturnQty,
    decimal UnitPrice,
    decimal ReturnTotal,
    ReturnReason Reason
);

public record ReturnResponseDto(string SrnNumber, decimal TotalRefund, RefundMethod RefundMethod);