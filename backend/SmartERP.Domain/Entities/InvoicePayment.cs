using SmartERP.Domain.Enums;

namespace SmartERP.Domain.Entities;

public class InvoicePayment : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public PaymentMethod Method { get; set; }
    public decimal Amount { get; set; }
    public string? Reference { get; set; }
    public string? CardType { get; set; }
    public string? CardLastFour { get; set; }
    public string? GvCode { get; set; }
    public Invoice Invoice { get; set; } = null!;
}