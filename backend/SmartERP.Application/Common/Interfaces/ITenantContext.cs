namespace SmartERP.Application.Common.Interfaces;

public interface ITenantContext
{
    Guid TenantId { get; }
    Guid LocationId { get; }
    Guid TerminalId { get; }
    string TenantSlug { get; }
}