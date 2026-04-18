using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TicketBookingSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRefundPoliciesToEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FullRefundDays",
                table: "Events",
                type: "int",
                nullable: false,
                defaultValue: 7);

            migrationBuilder.AddColumn<int>(
                name: "PartialRefundDays",
                table: "Events",
                type: "int",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.AddColumn<decimal>(
                name: "PartialRefundPercentage",
                table: "Events",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 50m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FullRefundDays",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "PartialRefundDays",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "PartialRefundPercentage",
                table: "Events");
        }
    }
}
