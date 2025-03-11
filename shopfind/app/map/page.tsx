"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Search, ShoppingBag, HelpCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

// define types for our data
interface Store {
  id: number
  name: string
  address: string
  lat: number
  lng: number
}

interface Product {
  id: number
  name: string
  category: string
  price: number
  image: string
  description: string
}

interface ProductStore {
  storeId: number
  productId: number
  price: number
  inStock: boolean
}

// set the mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN // ensure this is set in your environment

export default function MapPage() {
  // get search parameters from the url
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialSearchQuery = searchParams.get("search") || ""

  // state variables for managing search and data
  const [search, setSearch] = useState(initialSearchQuery)
  const [userLocation, setUserLocation] = useState<[number, number]>([-0.09, 51.505]) // default to london coordinates
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productStores, setProductStores] = useState<ProductStore[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [resultsFound, setResultsFound] = useState(true)

  // map references
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  // State for modal visibility
  const [isHelpModalOpen, setHelpModalOpen] = useState(false);

  // Add state for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // get user's location using geolocation api
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]) // mapbox uses [lng, lat]
        },
        () => {
          console.log("unable to retrieve your location")
        },
      )
    }
  }, [])

  // load mock data for demonstration
  useEffect(() => {
    setStores(mockStores)
    setProducts(mockProducts)
    setProductStores(mockProductStores)
  }, [])

  // initialize the map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [userLocation[0], userLocation[1]],
      zoom: 13,
    })

    // add navigation controls to the map
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

    // clean up the map on component unmount
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [userLocation[0], userLocation[1]])

  // update map center when user location changes
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({
        center: [userLocation[0], userLocation[1]],
        zoom: 13,
        essential: true,
      })
    }
  }, [userLocation])

  // handle search when url parameter changes
  useEffect(() => {
    if (initialSearchQuery) {
      handleSearch(initialSearchQuery)
    }
  }, [initialSearchQuery])

  // update markers when stores change
  useEffect(() => {
    // clear existing markers
    markers.current.forEach((marker) => marker.remove())
    markers.current = []

    if (!map.current) return

    // add new markers for each store
    stores.forEach((store) => {
      const storeProducts = findProductInStore(store.id)

      // create popup content for the store
      const popupContent = document.createElement("div")
      popupContent.className = "popup-content"

      const storeName = document.createElement("h3")
      storeName.className = "store-name"
      storeName.textContent = store.name
      popupContent.appendChild(storeName)

      const storeAddress = document.createElement("p")
      storeAddress.className = "store-address"
      storeAddress.textContent = store.address
      popupContent.appendChild(storeAddress)

      const productsContainer = document.createElement("div")
      productsContainer.className = "products-container"

      storeProducts.forEach((product) => {
        if (!product) return

        const productDiv = document.createElement("div")
        productDiv.className = "product-div"

        const productHeader = document.createElement("div")
        productHeader.className = "product-header"

        const productName = document.createElement("span")
        productName.className = "product-name"
        productName.textContent = product.name ?? ""

        const productPrice = document.createElement("span")
        productPrice.className = "product-price"
        productPrice.textContent = `$${product.price.toFixed(2)}`

        productHeader.appendChild(productName)
        productHeader.appendChild(productPrice)
        productDiv.appendChild(productHeader)

        // add product image placeholder
        const imgContainer = document.createElement("div")
        imgContainer.className = "img-container"
        imgContainer.style.backgroundImage = `url(${product.image || "/placeholder.svg"})`

        productDiv.appendChild(imgContainer)
        productsContainer.appendChild(productDiv)
      })

      popupContent.appendChild(productsContainer)

      // create a popup for the marker
      const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent)

      // create and add the marker to the map
      const marker = new mapboxgl.Marker()
        .setLngLat([store.lng, store.lat])
        .setPopup(popup)
        .addTo(map.current!)

      markers.current.push(marker)
    })
  }, [stores, search])

  // search function to filter products
  const handleSearch = (query: string) => {
    setIsLoading(true)

    // simulate api call delay
    setTimeout(() => {
      const filteredProducts = mockProducts.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase()),
      )

      if (filteredProducts.length > 0) {
        setResultsFound(true)
        const productIds = filteredProducts.map((p) => p.id)

        // find stores that carry these products
        const relevantProductStores = mockProductStores.filter((ps) => productIds.includes(ps.productId) && ps.inStock)

        // filter stores that have these products
        const storeIds = [...new Set(relevantProductStores.map((ps) => ps.storeId))]
        const filteredStores = mockStores.filter((store) => storeIds.includes(store.id))

        setStores(filteredStores)
      } else {
        setResultsFound(false)
        setStores([])
      }

      setIsLoading(false)
    }, 500)
  }

  // handle form submission for search
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/map?search=${encodeURIComponent(search)}`)
  }

  // find products available in a specific store
  const findProductInStore = (storeId: number) => {
    const storeProducts = mockProductStores
      .filter((ps) => ps.storeId === storeId && ps.inStock)
      .map((ps) => {
        const product = mockProducts.find((p) => p.id === ps.productId)
        return {
          ...product,
          price: ps.price,
        }
      })

    // filter by search query if present
    if (search) {
      return storeProducts.filter((product) => product?.name?.toLowerCase().includes(search.toLowerCase()))
    }

    return storeProducts
  }

  // Update the navigation links to highlight the current tab
  const navLinkClass = "text-sm font-medium hover:text-primary";
  const currentNavLinkClass = "text-sm font-medium text-primary";

  // Add the handleProductClick function
  const handleProductClick = (store: Store) => {
    if (map.current) {
      map.current.flyTo({
        center: [store.lng, store.lat],
        zoom: 15,
        essential: true,
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile-friendly header */}
      <header className="border-b">
        <div className="container flex items-center justify-between h-16 py-4">
          <Link href="/" className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ShopFind</span>
          </Link>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/" className={router.pathname === "/" ? currentNavLinkClass : navLinkClass}>
              Home
            </Link>
            <Link href="/map" className={router.pathname === "/map" ? currentNavLinkClass : navLinkClass}>
              Find Products
            </Link>
            <Button onClick={() => setHelpModalOpen(true)} className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-1" /> Help
            </Button>
          </nav>
        </div>

        {/* Mobile navigation menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="container py-2 space-y-2">
              <Link 
                href="/" 
                className={`block py-2 ${router.pathname === "/" ? currentNavLinkClass : navLinkClass}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/map" 
                className={`block py-2 ${router.pathname === "/map" ? currentNavLinkClass : navLinkClass}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Find Products
              </Link>
              <Button 
                onClick={() => {
                  setHelpModalOpen(true);
                  setIsMobileMenuOpen(false);
                }} 
                className="flex items-center w-full justify-start"
              >
                <HelpCircle className="h-5 w-5 mr-1" /> Help
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        {/* Mobile view controls */}
        <div className="md:hidden flex justify-center gap-2 p-2 border-b sticky top-0 bg-white z-20">
          <Button 
            onClick={() => {
              const sidebar = document.getElementById('sidebar');
              const map = document.getElementById('map-container');
              if (sidebar && map) {
                sidebar.style.display = '';
                map.style.display = 'none';
              }
            }}
            className="flex-1"
          >
            List View
          </Button>
          <Button 
            onClick={() => {
              const sidebar = document.getElementById('sidebar');
              const map = document.getElementById('map-container');
              if (sidebar && map) {
                sidebar.style.display = 'none';
                map.style.display = '';
              }
            }}
            className="flex-1"
          >
            Map View
          </Button>
        </div>
        
        {/* Sidebar */}
        <div id="sidebar" className="w-full md:w-1/3 p-3 pt-0 border-r h-[calc(100vh-4rem)] md:block overflow-y-auto">
          <div className="sticky top-0 bg-white z-10 p-4">
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for products..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full mt-2">
                Find Products
              </Button>
            </form>
            <h2 className="text-lg font-semibold">
              {stores.length} {stores.length === 1 ? "Store" : "Stores"} Found
            </h2>
          </div>

          {/* Search results */}
          {isLoading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !resultsFound ? (
            <div className="text-center my-8">
              <p className="text-muted-foreground">No products found matching "{search}"</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          ) : stores.length > 0 ? (
            <div className="space-y-4">
              {stores.map((store) => (
                <Card key={store.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{store.name}</h3>
                    <p className="text-sm text-muted-foreground">{store.address}</p>
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-sm font-medium mb-2">Available Products:</h4>
                      <div className="space-y-2">
                        {findProductInStore(store.id).map((product) => (
                          <div 
                            key={product?.id} 
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded"
                            onClick={() => {
                              handleProductClick(store);
                              // On mobile, switch to map view when a product is clicked
                              if (window.innerWidth < 768) {
                                const sidebar = document.getElementById('sidebar');
                                const map = document.getElementById('map-container');
                                if (sidebar && map) {
                                  sidebar.style.display = 'none';
                                  map.style.display = '';
                                }
                              }
                            }}
                          >
                            <span className="text-sm">{product?.name}</span>
                            <span className="text-sm font-medium">${product?.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </div>

        {/* Map container */}
        <div id="map-container" className="flex-1 h-[calc(100vh-4rem)] md:block">
          <div ref={mapContainer} className="h-full w-full" />
        </div>
      </main>

      {/* Help Modal - already mobile-friendly */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">How to Use This Page</h2>
            <p className="mb-2">1. Use the search bar to find products.</p>
            <p className="mb-2">2. Click on a product to view its store location on the map.</p>
            <p className="mb-2">3. Click on the store markers on the map to see more details.</p>
            <p className="mb-2">4. On mobile, use the List/Map toggle to switch views.</p>
            <Button onClick={() => setHelpModalOpen(false)} className="mt-4 w-full">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// mock data for demonstration purposes
const mockStores: Store[] = [
  { id: 1, name: "TechWorld", address: "5160 Cherry Ave, San Jose, CA 95118", lat: 37.257359, lng: -121.872940 },
  { id: 2, name: "SportsMart", address: "5675 Great America Pkwy, Santa Clara, CA", lat: 37.3595, lng: -121.9800 },
  { id: 3, name: "SJC Airport Baggage Claim", address: "1000 E El Camino Real, Santa Clara, CA", lat: 37.3614, lng: -121.9275 },
  { id: 4, name: "ElectroHub", address: "1500 S Bascom Ave, Santa Clara, CA", lat: 37.3120, lng: -121.9477 },
  { id: 5, name: "FashionPlace", address: "2000 N 1st St, Santa Clara, CA", lat: 37.3874, lng: -121.9454 },
  { id: 6, name: "HealthMart", address: "3000 Mission College Blvd, Santa Clara, CA", lat: 37.3896, lng: -121.9785 },
]

const mockProducts: Product[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 79.99,
    description: "Headphones with noise cancellation",
    image: "/headphones.webp?height=300&width=300",
  },
  {
    id: 2,
    name: "Running Shoes",
    category: "Sports & Outdoors",
    price: 89.99,
    description: "Running shoes with cushioning",
    image: "/shoes.webp?height=300&width=300",
  },
  {
    id: 3,
    name: "Coffee Maker",
    category: "Home & Kitchen",
    price: 49.99,
    description: "Automatic coffee maker",
    image: "/coffee.jpeg?height=300&width=300",
  },
  {
    id: 4,
    name: "Smartphone Charger (Lightning)",
    category: "Electronics",
    price: 14.99,
    description: "Charging cable for iPhone",
    image: "/charger.jpeg?height=300&width=300",
  },
  {
    id: 5,
    name: "Backpack",
    category: "Fashion",
    price: 39.99,
    description: "Normal size backpack",
    image: "/backpack.jpeg?height=300&width=300",
  },
  {
    id: 6,
    name: "Protein Powder",
    category: "Health & Wellness",
    price: 29.99,
    description: "GNC brand protein powder",
    image: "/gnc.avif?height=300&width=300",
  },
  {
    id: 7,
    name: "Smart Watch",
    category: "Electronics",
    price: 199.99,
    description: "Apple Watch Series 6",
    image: "/watch.jpeg?height=300&width=300",
  },
  {
    id: 8,
    name: "Yoga Mat",
    category: "Sports & Outdoors",
    price: 26.99,
    description: "Yoga mat with non-slip surface",
    image: "/mat.webp?height=300&width=300",
  },
]

const mockProductStores: ProductStore[] = [
  { storeId: 1, productId: 1, price: 79.99, inStock: true },
  { storeId: 1, productId: 4, price: 14.99, inStock: true },
  { storeId: 1, productId: 7, price: 199.99, inStock: true },
  { storeId: 2, productId: 2, price: 89.99, inStock: true },
  { storeId: 2, productId: 5, price: 39.99, inStock: true },
  { storeId: 2, productId: 8, price: 24.99, inStock: true },
  { storeId: 3, productId: 3, price: 49.99, inStock: true },
  { storeId: 3, productId: 5, price: 42.99, inStock: true },
  { storeId: 4, productId: 1, price: 74.99, inStock: true },
  { storeId: 4, productId: 4, price: 12.99, inStock: true },
  { storeId: 4, productId: 7, price: 189.99, inStock: true },
  { storeId: 5, productId: 5, price: 38.99, inStock: true },
  { storeId: 5, productId: 2, price: 94.99, inStock: true },
  { storeId: 6, productId: 6, price: 29.99, inStock: true },
  { storeId: 6, productId: 8, price: 22.99, inStock: true },
]

