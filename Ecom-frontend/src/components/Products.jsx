import ProductCard from "./ProductCard";
import { FaExclamationTriangle } from "react-icons/fa";

const Products = () => {

    const isLoading = false;
    const errorMessage = "";

    const products = [
        {
            productId: 652,
            productName: "Iphone Xs max",
            image: "https://placehold.co/600x400",
            description:
                "Experience the latest in mobile technology with advanced cameras, powerful processing, and an all-day battery.",
            quantity: 0,
            price: 1450.0,
            discount: 10.0,
            specialPrice: 1305.0,
        },
        {
            productId: 654,
            productName: "MacBook Air M2",
            image: "https://placehold.co/600x400",
            description:
                "Ultra-thin laptop with Apple's M2 chip, providing fast performance in a lightweight, portable design.",
            quantity: 15,
            price: 2550.0,
            discount: 20.0,
            specialPrice: 2040.0,
        },
    ];

    return (
        <div className="max-w-7xl mx-auto px-5 py-10">

            {isLoading ? (
                <p className="text-center text-lg">Loading...</p>
            ) : errorMessage ? (
                <div className="flex justify-center items-center h-52">
                    <FaExclamationTriangle className="text-red-500 text-3xl mr-2" />
                    <span className="text-lg font-medium">{errorMessage}</span>
                </div>
            ) : (
                <div
                    className="
                        grid
                        grid-cols-1
                        sm:grid-cols-2
                        md:grid-cols-3
                        lg:grid-cols-4
                        gap-8
                    "
                >
                    {products.map((item) => (
                        <ProductCard
                            key={item.productId}
                            {...item}
                        />
                    ))}
                </div>
            )}

        </div>
    );
};

export default Products;