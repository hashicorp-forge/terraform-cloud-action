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

output "string-sensitive" {
  value = "string-sensitive"
  sensitive = true
}

output "tuple" {
  value = ["hello", "list"]
}

output "object" {
  value = {
    hello = "object"
  }
}
