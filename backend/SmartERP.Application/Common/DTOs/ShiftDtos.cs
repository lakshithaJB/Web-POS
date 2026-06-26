namespace SmartERP.Application.Common.DTOs;

public record OpenShiftRequest(
    Guid TerminalId,
    Guid LocationId,
    decimal OpeningFloat,
    List<DenominationDto>? Denominations
);

public record CloseShiftRequest(
    decimal CountedCash,
    List<DenominationDto>? Denominations,
    decimal Variance
);

public record DenominationDto(decimal Value, string Label, int Count);

public record ShiftDto(
    Guid Id,
    string CashierName,
    Guid TerminalId,
    Guid LocationId,
    DateTime OpenedAt,
    decimal OpeningFloat,
    InvoiceBlockDto InvoiceBlock
);

public record InvoiceBlockDto(int Start, int End, int Current);