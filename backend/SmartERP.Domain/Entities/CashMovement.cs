namespace SmartERP.Domain.Entities;

public class CashMovement : BaseEntity
{
    public Guid ShiftId { get; set; }
    public Guid AuthorisedById { get; set; }
    public string Type { get; set; } = string.Empty; // PettyCashOut | CashIn | SafeDrop
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public Shift Shift { get; set; } = null!;
}