const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "kakxry24eom4",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "qIDNnBbBJe6S08NHfG3OyZZp4Vxt27Ak3d7D_ULQAFw",
});

//! Declare Variables

const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

//! Cart Items
let cart = [];

let buttonsDOM = [];

//! Getting The Products
class Products {
  async getProducts() {
    try {
      let contentful = await client.getEntries({
        content_type: "comfyHouseProducts",
      });
      console.log(contentful);
      //   let result = await fetch("products.json");
      //   let data = await result.json();
      let products = contentful.items;
      products = products.map((item) => {
        const { name, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { name, price, id, image };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

//! UI - Display Products
class UI {
  //! Rendering Product
  displayProducts(products) {
    let result = "";
    products.forEach((product) => {
      result += `
        <article class="product">
        <div class="img-container">
            <img src="${product.image}" alt="Product" class="product-img">
            <button class="bag-btn" data-id=${product.id}>
                <i class="fas fa-shopping-cart"></i>
                Add To Cart
            </button>
        </div>
        <h3>${product.name}</h3>
        <h4>$${product.price}</h4>
    </article>
        `;
    });
    productsDOM.innerHTML = result;
  }

  //!Getting cart Buttons
  getCartButtons() {
    const buttons = [...document.querySelectorAll(".bag-btn")];
    buttonsDOM = buttons;
    buttons.forEach((button) => {
      const id = button.dataset.id;
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      } else {
        button.addEventListener("click", (event) => {
          event.currentTarget.innerText = "In Cart";
          event.currentTarget.disabled = true;

          //! Getting Products from Storage
          let cartItem = { ...Storage.getProduct(id), amount: 1 };
          //!Add product to cart array
          cart = [...cart, cartItem];
          //!Saving cart items in local storage
          Storage.saveCart(cart);
          //!Setting cart values
          this.setCartValues(cart);
          //!Display items to cart
          this.addCartItem(cartItem);
          //!Show the cart
          this.showCart();

          //   console.log(cart);
        });
      }
    });
  }
  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map((item) => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });

    cartItems.innerText = itemsTotal;
    cartTotal.innerText = +tempTotal.toFixed(2);
  }

  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
        <img src="${item.image}" alt="">
        <div>
            <h4>${item.name}</h4>
            <h5>$${item.price}</h5>
            <span class="remove-item" data-id=${item.id}>remove</span>
        </div>
        <div>
            <i class="fas fa-chevron-up" data-id=${item.id}></i>
            <p class="item-amount">${item.amount}</p>
            <i class="fas fa-chevron-down" data-id=${item.id}></i>
        </div>
        `;
    cartContent.appendChild(div);
  }
  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }

  setupAPP() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartBtn.addEventListener("click", this.showCart);
    closeCartBtn.addEventListener("click", this.hideCart);
  }
  populateCart(cart) {
    cart.forEach((item) => {
      this.addCartItem(item);
    });
  }
  hideCart() {
    closeCartBtn.addEventListener("click", () => {
      cartOverlay.classList.remove("transparentBcg");
      cartDOM.classList.remove("showCart");
    });
  }

  cartLogic() {
    //!Clear cart Logic
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });
    //!Increase decrease item Logic
    cartContent.addEventListener("click", (event) => {
      if (event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id);
      } else if (event.target.classList.contains("fa-chevron-up")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (event.target.classList.contains("fa-chevron-down")) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount = tempItem.amount - 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(lowerAmount.parentElement.parentElement);
          this.removeItem(id);
        }
      }
    });
  }

  clearCart() {
    let cartItems = cart.map((item) => item.id);
    cartItems.forEach((id) => this.removeItem(id));
    while (cartContent.childElementCount > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }

  removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `
    <i class='fas fa-shopping-cart'></i> Add To cart
    `;
  }
  getSingleButton(id) {
    return buttonsDOM.find((button) => button.dataset.id === id);
  }
}
//! Local Storage
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }

  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find((product) => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const products = new Products();
  ui.setupAPP();
  //Get All Products
  products
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getCartButtons();
      ui.cartLogic();
    });
});
