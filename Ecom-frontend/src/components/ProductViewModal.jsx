import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

export default function ProductViewModal({
  open,
  setOpen,
  product,
}) {
  if (!product) return null;

  const {
    productName,
    image,
    description,
    quantity,
    price,
    discount,
    specialPrice,
  } = product;

  const isAvailable = Number(quantity) > 0;

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      className="relative z-50"
    >
      {/* Background */}
      <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      {/* Center */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">

          <DialogPanel
            className="
              w-full
              max-w-4xl
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-2xl
            "
          >

            {/* Product Image */}
            <div className="h-[380px] bg-gray-100 flex items-center justify-center overflow-hidden">

              <img
                src={image}
                alt={productName}
                className="
                  w-full
                  h-full
                  object-contain
                  p-8
                  transition-transform
                  duration-500
                  hover:scale-105
                "
              />

            </div>

            {/* Content */}
            <div className="p-7">

              {/* Name + Stock */}
              <div className="flex justify-between items-center gap-4">

                <DialogTitle className="text-4xl font-bold text-gray-900">
                  {productName}
                </DialogTitle>

                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold
                  ${
                    isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isAvailable ? "In Stock" : "Out of Stock"}
                </span>

              </div>

              {/* Price */}
              <div className="mt-5 flex items-center gap-4">

                {specialPrice ? (
                  <>
                    <span className="text-2xl text-gray-400 line-through">
                      ${Number(price).toFixed(2)}
                    </span>

                    <span className="text-4xl font-bold text-green-600">
                      ${Number(specialPrice).toFixed(2)}
                    </span>

                    {discount > 0 && (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {discount}% OFF
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-4xl font-bold text-blue-600">
                    ${Number(price).toFixed(2)}
                  </span>
                )}

              </div>

              {/* Divider */}
              <hr className="my-6" />

              {/* Description */}
              <div>

                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Description
                </h3>

                <p className="text-gray-600 leading-7">
                  {description}
                </p>

              </div>

              {/* Quantity */}
              <div className="mt-6">

                <span className="font-semibold text-gray-800">
                  Available Quantity :
                </span>

                <span className="ml-2 text-gray-600">
                  {quantity}
                </span>

              </div>

              {/* Buttons */}
              <div className="mt-8 flex justify-end gap-4">

                <button
                  onClick={() => setOpen(false)}
                  className="
                    px-6
                    py-3
                    rounded-xl
                    border
                    border-gray-300
                    text-gray-700
                    hover:bg-gray-100
                    transition
                  "
                >
                  Close
                </button>

                <button
                  disabled={!isAvailable}
                  className={`
                    px-8
                    py-3
                    rounded-xl
                    font-semibold
                    text-white
                    transition
                    ${
                      isAvailable
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }
                  `}
                >
                  Add to Cart
                </button>

              </div>

            </div>

          </DialogPanel>

        </div>
      </div>
    </Dialog>
  );
}