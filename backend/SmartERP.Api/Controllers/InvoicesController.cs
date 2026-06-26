using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartERP.Application.Common.DTOs;
using SmartERP.Application.Common.Interfaces;
using SmartERP.Domain.Entities;

namespace SmartERP.Api.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public class InvoicesController(IAppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> PostInvoice([FromBody] PostInvoiceRequest req)
    {
        // Idempotency — reject duplicate submissions
        if (req.IdempotencyKey is not null)
        {
            var duplicate = await db.Invoices
                .AnyAsync(i => i.IdempotencyKey == req.IdempotencyKey);
            if (duplicate) return Ok(new { message = "Already posted (idempotent)" });
        }

        var invoice = new Invoice
        {
            InvoiceNumber = req.InvoiceNumber,
            ShiftId = req.ShiftId,
            TerminalId = req.TerminalId,
            LocationId = req.LocationId,
            TenantId = Guid.Parse(User.FindFirst("tenantId")!.Value),
            CashierId = req.CashierId,
            CustomerId = req.CustomerId,
            Subtotal = req.Subtotal,
            TotalDiscount = req.TotalDiscount,
            TaxTotal = req.TaxTotal,
            NetTotal = req.NetTotal,
            RoundingAmount = req.RoundingAmount,
            PayableAmount = req.PayableAmount,
            InvoiceDate = req.FinalisedAt,
            IdempotencyKey = req.IdempotencyKey,
        };

        invoice.Lines = req.Lines.Select(l => new InvoiceLine
        {
            ProductId = l.ProductId,
            ProductName = l.ProductName,
            Barcode = l.Barcode,
            Qty = l.Qty,
            UnitPrice = l.UnitPrice,
            DiscountPercent = l.DiscountPercent,
            DiscountAmount = l.DiscountAmount,
            TaxAmount = l.TaxAmount,
            LineTotal = l.LineTotal,
            IsFree = l.IsFree,
            Note = l.Note,
        }).ToList();

        invoice.Payments = req.Payments.Select(p => new InvoicePayment
        {
            Method = p.Method,
            Amount = p.Amount,
            Reference = p.Reference,
            CardType = p.CardType,
            CardLastFour = p.CardLastFour,
            GvCode = p.GvCode,
        }).ToList();

        db.Invoices.Add(invoice);

        // Deduct stock
        foreach (var line in req.Lines)
        {
            var product = await db.Products.FindAsync(line.ProductId);
            if (product?.TrackStock == true)
                product.StockQty -= line.Qty;
        }

        await db.SaveChangesAsync();
        return Ok(new { invoiceId = invoice.Id, invoiceNumber = invoice.InvoiceNumber });
    }

    [HttpGet("{invoiceNumber}")]
    public async Task<IActionResult> GetInvoice(string invoiceNumber)
    {
        var invoice = await db.Invoices
            .Include(i => i.Lines)
            .Include(i => i.Customer)
            .FirstOrDefaultAsync(i => i.InvoiceNumber == invoiceNumber);

        if (invoice is null) return NotFound();
        return Ok(invoice);
    }
}