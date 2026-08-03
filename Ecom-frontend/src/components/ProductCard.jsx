import { useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import ProductViewModal from "./ProductViewModal";

const ProductCard = ({
    productId,
    productName,
    image,
    description,
    quantity,
    price,
    discount,
    specialPrice,
}) => {

    const [openProductViewmodel, setOpenProductViewmodel] = useState(false);
    const [selectedViewProduct, setSelectedViewProduct] = useState("");
    const btnLoader = false;

    const isAvailable = quantity && Number(quantity) > 0;

    const handleProductView = (product) => {
        setSelectedViewProduct(product);
        setOpenProductViewmodel(true);
    };

    return (
        <div
            className="
                bg-white
                rounded-2xl
                border
                border-gray-200
                shadow-md
                hover:shadow-2xl
                hover:-translate-y-2
                transition-all
                duration-300
                overflow-hidden
                flex
                flex-col
                h-[430px]
                group
            "
        >

            {/* Image */}
            <div
                className="relative h-56 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() =>
                    handleProductView({
                        id: productId,
                        productName,
                        image,
                        description,
                        quantity,
                        price,
                        discount,
                        specialPrice,
                    })
                }
            >

                <img
                    src={image}
                    alt={productName}
                    className="
                        w-full
                        h-full
                        object-contain
                        p-4
                        transition-transform
                        duration-500
                        group-hover:scale-110
                    "
                />

                <span
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow
                        ${
                            isAvailable
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                        }`}
                >
                    {isAvailable ? "In Stock" : "Out of Stock"}
                </span>

            </div>

            {/* Details */}
            <div className="p-5 flex flex-col flex-1">

                <h2
                    onClick={() =>
                        handleProductView({
                            id: productId,
                            productName,
                            image,
                            description,
                            quantity,
                            price,
                            discount,
                            specialPrice,
                        })
                    }
                    className="
                        text-lg
                        font-semibold
                        text-gray-800
                        line-clamp-2
                        hover:text-blue-600
                        transition-colors
                        cursor-pointer
                        min-h-[56px]
                    "
                >
                    {productName}
                </h2>

                <p className="text-sm text-gray-500 line-clamp-3 mt-2 min-h-[60px]">
                    {description}
                </p>

                {/* Price Section */}
                <div className="mt-auto border-t border-gray-100 pt-4">

                    {specialPrice ? (
                        <>
                            <div className="flex items-center gap-2">

                                <span className="text-gray-400 line-through text-lg">
                                    ${Number(price).toFixed(2)}
                                </span>

                                <span className="text-2xl font-bold text-green-600">
                                    ${Number(specialPrice).toFixed(2)}
                                </span>

                            </div>

                            {discount && (
                                <span className="inline-block mt-2 bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
                                    {discount}% OFF
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-2xl font-bold text-blue-700">
                            ${Number(price).toFixed(2)}
                        </span>
                    )}

                    <button
                        disabled={!isAvailable || btnLoader}
                        onClick={() => {}}
                        className={`
                            mt-4
                            w-full
                            flex
                            items-center
                            justify-center
                            gap-2
                            py-3
                            rounded-xl
                            font-semibold
                            text-white
                            transition-all
                            duration-300
                            ${
                                isAvailable
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-gray-400 cursor-not-allowed"
                            }
                        `}
                    >
                        <FaShoppingCart />
                        {isAvailable ? "Add to Cart" : "Out of Stock"}
                    </button>

                </div>

            </div>

            <ProductViewModal 
            open = {openProductViewmodel}
            setOpen = {setOpenProductViewmodel}
            product= {selectedViewProduct}
            isAvailable = {isAvailable}/>

        </div>
    );
};

export default ProductCard;