# Bus only — no rules yet. Each phase adds the rules it needs for the
# events it produces/consumes (BookPublished, OrderCreated,
# ImportCompleted, ... — plan/contracts/events/) in its own branch.

resource "aws_cloudwatch_event_bus" "this" {
  name = "pk-literature-${var.environment}"

  tags = {
    Environment = var.environment
  }
}
