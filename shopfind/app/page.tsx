import Link from "next/link"
import Image from "next/image"
import { MapPin, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Home page component
// Our classes are a mix between being defined in the global styles and via tailwindcss classes, which allow us to style our components easily
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* header with logo and navigation links */}
      <header className="border-b">
        <div className="container flex items-center justify-between h-16 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ShopFind</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium">
              Home
            </Link>
            <Link href="/map" className="text-sm font-medium">
              Find Products
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">

        {/* section with title and button to redirect to map page */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-muted/50 to-background">
          <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              ShopFind
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Find Products in Stores Near You
            </p>
            <Link href="/map">
              <Button size="lg" className="mt-4">
                <MapPin className="mr-2 h-4 w-4" />
                Find Products Near Me
              </Button>
            </Link>
          </div>
        </section>

        {/* section with popular product cards */}
        <section className="w-full py-12 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Popular Products</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
                  Discover what other shoppers are searching for in your area
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">

              {/* map over popular products and display them in cards */}
              {popularProducts.map((product) => (
                <Link key={product.id} href={`/map?search=${encodeURIComponent(product.name)}`}>
                  {/* card is part of the radix ui library for next which made our job easier */}
                  <Card className="h-full overflow-hidden transition-all hover:shadow-lg">
                    <div className="aspect-square relative">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm">From ${product.price.toFixed(2)}</span>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{product.storesCount} stores</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* section with steps on how to use the app */}
        <section className="w-full py-12 md:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How ShopFind Works</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
                  Find the products you need in just a few simple steps
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">1</div>
                <h3 className="mt-4 text-xl font-bold">Search for a Product</h3>
                <p className="mt-2 text-muted-foreground">Enter what you're looking for in the search bar</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">2</div>
                <h3 className="mt-4 text-xl font-bold">View on the Map</h3>
                <p className="mt-2 text-muted-foreground">See all the stores that carry your product nearby</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">3</div>
                <h3 className="mt-4 text-xl font-bold">Compare and Shop</h3>
                <p className="mt-2 text-muted-foreground">Compare prices and head to the store of your choice</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        </div>
      </footer>
    </div>
  )
}

// mock data for demonstration purposes
const popularProducts = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 79.99,
    storesCount: 12,
    image: "/headphones.webp?height=300&width=300",
  },
  {
    id: 2,
    name: "Running Shoes",
    category: "Sports & Outdoors",
    price: 89.99,
    storesCount: 8,
    image: "/shoes.webp?height=300&width=300",
  },
  {
    id: 3,
    name: "Coffee Maker",
    category: "Home & Kitchen",
    price: 49.99,
    storesCount: 15,
    image: "/coffee.jpeg?height=300&width=300",
  },
  {
    id: 4,
    name: "Smartphone Charger (Lightning)",
    category: "Electronics",
    price: 14.99,
    storesCount: 24,
    image: "/charger.jpeg?height=300&width=300",
  },
  {
    id: 5,
    name: "Backpack",
    category: "Fashion",
    price: 39.99,
    storesCount: 6,
    image: "/backpack.jpeg?height=300&width=300",
  },
  {
    id: 6,
    name: "Protein Powder",
    category: "Health & Wellness",
    price: 29.99,
    storesCount: 9,
    image: "/gnc.avif?height=300&width=300",
  },
  {
    id: 7,
    name: "Smart Watch",
    category: "Electronics",
    price: 199.99,
    storesCount: 11,
    image: "/watch.jpeg?height=300&width=300",
  },
  {
    id: 8,
    name: "Yoga Mat",
    category: "Sports & Outdoors",
    price: 26.99,
    storesCount: 7,
    image: "/mat.webp?height=300&width=300",
  },
]

