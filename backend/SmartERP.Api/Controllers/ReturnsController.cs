using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartERP.Application.Common.DTOs;
using SmartERP.Application.Common.Interfaces;
using SmartERP.Domain.Entities;

namespace SmartERP.Api.Controllers;

[ApiController]
[Route("api/returns")]
[Authorize]
public class ReturnsController(IAppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> PostReturn([FromBody] PostReturnRequest req)
    {
        var originalInvoice = await db.Invoices
            .Include(i => i.Lines)
            .FirstOrDefaultAsync(i => i.InvoiceNumber == req.OriginalInvoiceNumber);

        if (originalInvoice is null)
            return NotFound($"Invoice {req.OriginalInvoiceNumber} not found");

        // Validate return quantities do not exceed original
        foreach (var returnLine in req.Lines)
        {
            var originalLine = originalInvoice.Lines.FirstOrDefault(l => l.Id == returnLine.OriginalLineId);
            if (originalLine is null) continue;

            var alreadyReturned = await db.SalesReturnLines
                .Where(rl => rl.OriginalLineId == returnLine.OriginalLineId)
                .SumAsync(rl => rl.ReturnQty);

            if (alreadyReturned + returnLine.ReturnQty > originalLine.Qty)
                return BadRequest($"Return quantity for {returnLine.ProductName} exceeds original quantity");
        }

        var srnNumber = $"SRN-{req.LocationId.ToString()[..8].ToUpper()}-{DateTime.UtcNow:yyyyMMddHHmmss}";

        var salesReturn = new SalesReturn
        {
            TenantId = Guid.Parse(User.FindFirst("tenantId")!.Value),
            LocationId = req.LocationId,
            ShiftId = req.ShiftId,
            CashierId = req.CashierId,
            OriginalInvoiceId = originalInvoice.Id,
            SrnNumber = srnNumber,
            RefundMethod = req.RefundMethod,
            TotalRefund = req.TotalRefund,
            ReturnedAt = req.ReturnedAt,
            Lines = req.Lines.Select(l => new SalesReturnLine
            {
                OriginalLineId = l.OriginalLineId,
                ProductId = l.ProductId,
                ProductName = l.ProductName,
                ReturnQty = l.ReturnQty,
                UnitPrice = l.UnitPrice,
                ReturnTotal = l.ReturnTotal,
                Reason = l.Reason,
            }).ToList(),
        };

        db.SalesReturns.Add(salesReturn);

        // Restore stock
        foreach (var line in req.Lines)
        {
            var product = await db.Products.FindAsync(line.ProductId);
            if (product?.TrackStock == true)
                product.StockQty += line.ReturnQty;
        }

        await db.SaveChangesAsync();

        return Ok(new ReturnResponseDto(srnNumber, req.TotalRefund, req.RefundMethod));
    }
}