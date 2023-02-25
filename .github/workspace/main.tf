resource "null_resource" "example" {
  triggers = {
    "hello" = "world"
  }
}

output "string" {
  value = "string"
}

output "number" {
  value = 3.14159
}

output "tuple" {
  value = ["hello", "list"]
}

output "object" {
  value = {
    hello = "object"
  }
}
