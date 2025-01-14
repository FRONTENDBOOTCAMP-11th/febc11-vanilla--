import axios from 'axios';

let cart = {
  items: [],
  total: 0,
};

let wishlist = [
  // {
  //   _id: 9,
  //   user_id: 4,
  //   memo: '다음에 재구매',
  //   createdAt: '2024.04.08 16:47:46',
  //   product: {
  //     _id: 4,
  //     name: '레고 테크닉',
  //     price: 45000,
  //     quantity: 100,
  //     buyQuantity: 89,
  //     image: {
  //       url: 'https://via.placeholder.com/150',
  //       fileName: 'sample-bugatti.png',
  //       orgName: '부가티.png',
  //     },
  //     extra: {
  //       isNew: false,
  //       isBest: true,
  //       category: ['PC03', 'PC0303'],
  //       sort: 1,
  //       size: ['XS', 'S', 'M', 'L', 'XL'],
  //     },
  //   },
  // },
];

// 이 ID로 로그인하고 있다고 가정하고 TEST 시도중
// let accessToken =
//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOjUsInR5cGUiOiJ1c2VyIiwibmFtZSI6IkdEIiwiZW1haWwiOiJhcGlAbWFya2V0LmNvbSIsImxvZ2luVHlwZSI6ImVtYWlsIiwiaWF0IjoxNzMwMDc2MDg1LCJleHAiOjE3MzAxNjI0ODUsImlzcyI6IkZFU1AifQ.IwbcsQGQooCY9cReXhCjdomfGlKCPzkBVzMP_ujUiyY'; // 예시로 접근 토큰 저장
let accessToken = null;

// 장바구니 정보 업데이트
async function fetchCart() {
  try {
    accessToken = sessionStorage.getItem('accessToken') || null;

    let response;
    if (accessToken) {
      // 로그인한 경우
      response = await axios.get('https://11.fesp.shop/carts', {
        headers: {
          'Content-Type': 'application/json',
          'client-id': 'vanilla01',
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else {
      // 비로그인 상태인 경우
      response = await axios.post(
        'https://11.fesp.shop/carts/local',
        {
          products: [],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'client-id': 'vanilla01',
          },
        },
      );
    }

    console.log(response.data);

    if (
      response.data &&
      response.data.item &&
      Array.isArray(response.data.item)
    ) {
      cart.items = response.data.item;
    } else {
      cart.items = [];
    }

    updateCartView();
    updateOrderSummary();
  } catch (error) {
    console.error(
      '카트 데이터를 가져오는 데 실패했습니다:',
      error.response ? error.response.data : error.message,
    );
  }
}

function initCart() {
  //   updateCartView();
  fetchCart();
  updateWishlistView();
}

function updateCartView() {
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyCartMessage = document.getElementById('empty-cart-message');
  const orderSummary = document.getElementById('order-summary');

  if (cart.items.length === 0) {
    cartItemsContainer.style.display = 'none';
    emptyCartMessage.style.display = 'block';
    orderSummary.style.display = 'none';
  } else {
    cartItemsContainer.style.display = 'block';
    emptyCartMessage.style.display = 'none';
    orderSummary.style.display = 'block';

    cartItemsContainer.innerHTML = cart.items
      .map(item => {
        // image 속성이 없을 경우 기본 이미지 URL 사용
        const baseURL = 'https://11.fesp.shop';
        const imageUrl = item.product.image.path
          ? `${baseURL}${item.product.image.path}`
          : 'https://via.placeholder.com/150';
        const itemName = item.product.name || '이름 없는 상품';
        const itemPrice = (item.product.price || 0).toLocaleString();
        const categoryDescription = item.product.extra?.category
          ? item.product.extra.category.join(', ')
          : '';

        return `
            <div class="cart-item">
              <img src="${imageUrl}" alt="${itemName}" onerror="this.onerror=null; this.src='https://via.placeholder.com/150'">
              <div class="item-details">
                <div class="item-header">
                  <div class="item-name">${itemName}</div>
                  <div class="item-price">${itemPrice.toLocaleString()}원</div>
                </div>
                <div class="item-option">${item.product.extra.color}</div>
                <div class="item-description">${categoryDescription}</div>
                <div>
                  <span class="item-size">사이즈 ${item.size}</span>
                  <div class="quantity-control">
                  <button class="button-class" onclick="changeQuantity(${
                    item._id
                  }, -1)">-</button>
                  <input type="number" value="${
                    item.quantity
                  }" min="1" onchange="updateQuantity(${item._id}, this.value)">
                  <button class="button-class" onclick="changeQuantity(${
                    item._id
                  }, 1)">+</button>
                </div>
              </div>
              <div class="item-actions">
                <button class="add-to-wishlist button-class" onclick="addToWishlist(${
                  item._id
                })">
                <img src="/assets/icons/button36px/white-heart.svg" alt="빈 하트" style="width: 24px; height: auto;"></button>
                <button class="remove-item button-class" onclick="removeItem(${
                  item._id
                })">
                  <img src="/assets/icons/button36px/delete.svg" alt="삭제" style="width: 20px; height: auto;">
                </button>
              </div>
            </div>
          </div>
          <div class="delivery-info">
            <div class="shipping-fee">${
              item.shippingFees
                ? item.shippingFees.toLocaleString()
                : '무료배송'
            }</div>
            <div class="delivery-details">도착 예정일: ${
              item.deliveryDate || '정보 없음'
            }
              <span class="region-edit"><a href="#">지역 수정</a></span> 
            </div>
          </div> 
        `;
      })
      .join('');

    cartItemsContainer.querySelectorAll('.decrease').forEach(button => {
      button.addEventListener('click', e => {
        const itemId = e.target.dataset.id;
        changeQuantity(itemId, -1);
      });
    });

    cartItemsContainer.querySelectorAll('.increase').forEach(button => {
      button.addEventListener('click', e => {
        const itemId = e.target.dataset.id;
        changeQuantity(itemId, 1);
      });
    });

    cartItemsContainer.querySelectorAll('.add-to-wishlist').forEach(button => {
      button.addEventListener('click', e => {
        const itemId = e.target.dataset.id;
        addToWishlist(itemId);
      });
    });

    cartItemsContainer.querySelectorAll('.remove-item').forEach(button => {
      button.addEventListener('click', e => {
        const itemId = e.target.dataset.id;
        removeItem(itemId);
      });
    });

    updateOrderSummary();
  }
}

function updateWishlistView() {
  const wishlistContainer = document.getElementById('wishlist-items');
  wishlistContainer.innerHTML = wishlist
    .map(item => {
      // 이미지 URL과 제품 이름이 정의되어 있는지 체크
      const baseURL = 'https://11.fesp.shop';
      const imageUrl = item.product.image.path
        ? `${baseURL}${item.product.image.path}`
        : 'https://via.placeholder.com/150';
      const productName = item.product?.name || '이름 없는 상품';
      const productPrice =
        item.product?.price?.toLocaleString() || '가격 정보 없음';

      return `
        <div class="wishlist-item">
            <img src="${imageUrl}" alt="${productName}" >
            <div class="item-details">
                <div class="item-header">
                  <div class="item-name">${productName}</div>
                  <div class="item-price">${productPrice}원</div>
                </div>
                <div class="item-category">${item.product.extra.category}</div>
                <div class="item-size">사이즈 <a href="#">${item.product.extra.size[0]}</a></div>
                <button class="add-to-cart-button" onclick="addToCartFromWishlist(${item.product._id})">장바구니에 추가</button>
            </div>
        </div>
      `;
    })
    .join('');
}

function updateOrderSummary() {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  document.getElementById('subtotal').textContent =
    `${subtotal.toLocaleString()}원`;
  document.getElementById('total').textContent =
    `${subtotal.toLocaleString()}원`;
}

function changeQuantity(itemId, change) {
  const item = cart.items.find(i => i._id === itemId);
  if (item) {
    item.quantity = Math.max(1, item.quantity + change);
    updateCartQuantity(itemId, item.quantity);
    updateCartView();
  }
}
window.changeQuantity = changeQuantity;

function updateQuantity(itemId, newQuantity) {
  const item = cart.items.find(i => i._id === itemId);
  if (item) {
    item.quantity = Math.max(1, parseInt(newQuantity) || 1);
    updateCartQuantity(itemId, item.quantity);
    updateCartView();
  }
}
window.updateQuantity = updateQuantity;

function removeItem(itemId) {
  cart.items = cart.items.filter(item => item._id !== itemId);
  deleteCartItem(itemId);
  updateCartView();
}
window.removeItem = removeItem;

function addToWishlist(itemId) {
  const item = cart.items.find(i => i._id === itemId);
  if (item && !wishlist.some(w => w._id === itemId)) {
    wishlist.push({ ...item });
    updateWishlistView();
  }
}
window.addToWishlist = addToWishlist;

function addToCartFromWishlist(productId) {
  const item = wishlist.find(i => i.product?._id === productId);
  if (item && item.product) {
    const existingCartItem = cart.items.find(i => i.product_id === productId); // 수정된 부분
    if (existingCartItem) {
      existingCartItem.quantity += 1;
    } else {
      cart.items.push({
        _id: item._id,
        user_id: item.user_id,
        product_id: item.product._id,
        quantity: 1,
        size: item.size || '미설정',
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
        product: {
          ...item.product,
          image: {
            path: item.product.image.url,
            name: item.product.image.fileName,
            originalname: item.product.image.orgName,
          },
        },
        shippingFees: '무료 배송',
        deliveryDate: '7월 26일 (금)',
      });
    }
    updateCartView();
  }
}
window.addToCartFromWishlist = addToCartFromWishlist;

// 장바구니 수량 업데이트 API 요청
async function updateCartQuantity(itemId, quantity) {
  try {
    await axios.patch(
      `https://11.fesp.shop/carts/${itemId}`,
      { quantity },
      {
        headers: {
          'Content-Type': 'application/json',
          'client-id': 'vanilla01',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
  } catch (error) {
    console.error(
      '수량 업데이트에 실패했습니다:',
      error.response ? error.response.data : error.message,
    );
  }
}

// 장바구니에서 항목 삭제 API 요청
async function deleteCartItem(itemId) {
  try {
    await axios.delete(`https://11.fesp.shop/carts/${itemId}`, {
      headers: {
        'Content-Type': 'application/json',
        'client-id': 'vanilla01',
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    console.error(
      '항목 삭제에 실패했습니다:',
      error.response ? error.response.data : error.message,
    );
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document
    .getElementById('order-button')
    .addEventListener('click', function () {
      alert('주문이 완료되었습니다!');
    });
  initCart();
});
