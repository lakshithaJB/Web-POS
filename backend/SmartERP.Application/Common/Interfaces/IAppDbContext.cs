using Microsoft.EntityFrameworkCore;
using SmartERP.Domain.Entities;

namespace SmartERP.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<Location> Locations { get; }
    DbSet<Terminal> Terminals { get; }
    DbSet<AppUser> Users { get; }
    DbSet<Shift> Shifts { get; }
    DbSet<Invoice> Invoices { get; }
    DbSet<InvoiceLine> InvoiceLines { get; }
    DbSet<InvoicePayment> InvoicePayments { get; }
    DbSet<Customer> Customers { get; }
    DbSet<Product> Products { get; }
    DbSet<Category> Categories { get; }
    DbSet<SalesReturn> SalesReturns { get; }
    DbSet<SalesReturnLine> SalesReturnLines { get; }
    DbSet<CashMovement> CashMovements { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}