using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartERP.Application.Common.DTOs;
using SmartERP.Application.Common.Interfaces;
using SmartERP.Domain.Entities;
using SmartERP.Domain.Enums;

namespace SmartERP.Api.Controllers;

[ApiController]
[Route("api/shifts")]
[Authorize]
public class ShiftsController(IAppDbContext db) : ControllerBase
{
    private static readonly object _blockLock = new();
    private const int BlockSize = 100;

    [HttpPost("open")]
    public async Task<IActionResult> OpenShift([FromBody] OpenShiftRequest req)
    {
        var existing = await db.Shifts.AnyAsync(s =>
            s.TerminalId == req.TerminalId && s.Status == ShiftStatus.Open);

        if (existing) return Conflict("A shift is already open on this terminal");

        var cashierId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        // Allocate invoice number block
        var location = await db.Locations.FindAsync(req.LocationId);
        if (location is null) return NotFound("Location not found");

        int blockStart, blockEnd;
        lock (_blockLock)
        {
            var lastInvoice = db.Invoices
                .Where(i => i.LocationId == req.LocationId)
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefault();

            var lastNum = lastInvoice is null ? 0 :
                int.TryParse(lastInvoice.InvoiceNumber.Split('-').Last(), out var n) ? n : 0;

            var pendingShift = db.Shifts
                .Where(s => s.LocationId == req.LocationId)
                .OrderByDescending(s => s.OpenedAt)
                .FirstOrDefault();

            blockStart = Math.Max(lastNum + 1, (pendingShift?.InvoiceBlockEnd ?? 0) + 1);
            blockEnd = blockStart + BlockSize - 1;
        }

        var shift = new Shift
        {
            TerminalId = req.TerminalId,
            LocationId = req.LocationId,
            TenantId = Guid.Parse(User.FindFirst("tenantId")!.Value),
            CashierId = cashierId,
            OpeningFloat = req.OpeningFloat,
            InvoiceBlockStart = blockStart,
            InvoiceBlockEnd = blockEnd,
            InvoiceBlockCurrent = blockStart,
        };

        db.Shifts.Add(shift);
        await db.SaveChangesAsync();

        var products = await db.Products
            .Where(p => p.LocationId == req.LocationId && p.IsActive)
            .ToListAsync();

        return Ok(new
        {
            shift = new ShiftDto(
                shift.Id,
                User.Identity!.Name ?? string.Empty,
                shift.TerminalId,
                shift.LocationId,
                shift.OpenedAt,
                shift.OpeningFloat,
                new InvoiceBlockDto(blockStart, blockEnd, blockStart)
            ),
            invoiceBlock = new InvoiceBlockDto(blockStart, blockEnd, blockStart),
            products,
        });
    }

    [HttpPost("{shiftId}/close")]
    public async Task<IActionResult> CloseShift(Guid shiftId, [FromBody] CloseShiftRequest req)
    {
        var shift = await db.Shifts.FindAsync(shiftId);
        if (shift is null) return NotFound();
        if (shift.Status == ShiftStatus.Closed) return Conflict("Shift already closed");

        shift.Status = ShiftStatus.Closed;
        shift.ClosedAt = DateTime.UtcNow;
        shift.CountedCash = req.CountedCash;
        shift.Variance = req.Variance;

        var invoices = await db.Invoices
            .Where(i => i.ShiftId == shiftId)
            .Include(i => i.Payments)
            .ToListAsync();

        var zReport = new
        {
            shiftId,
            closedAt = shift.ClosedAt,
            openingFloat = shift.OpeningFloat,
            countedCash = req.CountedCash,
            variance = req.Variance,
            billCount = invoices.Count(i => i.Status == InvoiceStatus.Paid),
            totalSales = invoices.Where(i => i.Status == InvoiceStatus.Paid).Sum(i => i.NetTotal),
            cashSales = invoices.SelectMany(i => i.Payments)
                .Where(p => p.Method == PaymentMethod.Cash).Sum(p => p.Amount),
            cardSales = invoices.SelectMany(i => i.Payments)
                .Where(p => p.Method == PaymentMethod.Card).Sum(p => p.Amount),
        };

        shift.ZReportJson = System.Text.Json.JsonSerializer.Serialize(zReport);
        await db.SaveChangesAsync();

        return Ok(new { zReport = shift.ZReportJson });
    }

    [HttpPost("{shiftId}/request-block")]
    public async Task<IActionResult> RequestNewBlock(Guid shiftId)
    {
        var shift = await db.Shifts.FindAsync(shiftId);
        if (shift is null) return NotFound();

        int newStart, newEnd;
        lock (_blockLock)
        {
            newStart = shift.InvoiceBlockEnd + 1;
            newEnd = newStart + BlockSize - 1;
            shift.InvoiceBlockEnd = newEnd;
        }

        await db.SaveChangesAsync();
        return Ok(new InvoiceBlockDto(newStart, newEnd, newStart));
    }
}