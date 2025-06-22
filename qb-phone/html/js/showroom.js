// qb-phone/html/js/showroom.js

var ShowroomSearchActive = false; // Biến để theo dõi trạng thái thanh tìm kiếm
var OpenedVehicleDetail = null; // Biến để theo dõi xe đang được xem chi tiết
var CurrentShowroomCategory = 'used'

// ======================= [PHẦN MỚI] =======================
// Thêm danh sách xe mod tương tự như garage.js
// Hãy đảm bảo danh sách này khớp với danh sách trong garage.js
const moddedVehicleListShowroom = [
   
    "zn20", 
    "car_cat",
];
// ===================== [KẾT THÚC PHẦN MỚI] =====================

$(document).ready(function() {
    // Khai báo các hằng số để xử lý đồ độ
    const modNames = {
        "11": "Động cơ",
        "13": "Hộp số",
        "16": "Giáp",
        "12": "Phanh",
        "15": "Hệ thống treo",
        "18": "Turbo"
    };
    const modKeyToIdMap = {
        "modEngine": "11",
        "modTransmission": "13",
        "modArmor": "16",
        "modBrakes": "12",
        "modSuspension": "15",
        "modTurbo": "18"
    };
    // Các modId cần hiển thị (đã được lọc ở server, nhưng có thể lọc lại ở client nếu cần)
    const modsToDisplay = ["11", "13", "16", "18"];

    // Hàm tìm kiếm xe khi người dùng gõ vào ô tìm kiếm
    $("#showroom-search-input").on("keyup", function() {
        var value = $(this).val().toLowerCase();
        $(".showroom-vehicle-list .showroom-card").filter(function() {
          $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });

    // Xử lý nút tìm kiếm (nếu có icon tìm kiếm riêng)
    $(document).on('click', '.showroom-search-icon', function(e){
        e.preventDefault();
        if (!ShowroomSearchActive) {
            $("#showroom-search-input").fadeIn(150);
            ShowroomSearchActive = true;
        } else {
            $("#showroom-search-input").fadeOut(150);
            ShowroomSearchActive = false;
        }
    });

        $(document).on('click', '.showroom-tab', function(e) {
        e.preventDefault();
        const category = $(this).data('category');

        if (category !== CurrentShowroomCategory) {
            // Cập nhật trạng thái 'selected' cho tab
            $('.showroom-tab').removeClass('selected');
            $(this).addClass('selected');
            CurrentShowroomCategory = category;

            // Xóa danh sách xe hiện tại
            $(".showroom-vehicle-list").html("<p style='color: #8f8f8f; text-align: center; margin-top: 5vh;'>Đang tải...</p>");

            // Gọi callback tương ứng với category
            if (category === 'used') {
                // Sử dụng lại callback cũ cho xe cũ
                $.post('https://qb-phone/GetSalesVehicles', JSON.stringify({}), function(vehicles){
                    SetupShowroomVehicles(vehicles);
                });
            } else if (category === 'new') {
                // Callback mới cho xe mới
                $.post('https://qb-phone/GetNewVehicles', JSON.stringify({}), function(vehicles){
                    SetupShowroomVehicles(vehicles); // Có thể tái sử dụng hàm này
                });
            } else if (category === 'selling') {
                // Callback mới cho xe bạn bán
                $.post('https://qb-phone/GetMySellingVehicles', JSON.stringify({}), function(vehicles){
                    SetupShowroomVehicles(vehicles);
                });
            }
        }
    });

SetupShowroomVehicles = function(data) {
    const listContainer = $(".showroom-vehicle-list");
    listContainer.html(""); // Luôn xóa danh sách cũ

    // Kiểm tra xem dữ liệu có phải là một danh sách phẳng (Array) hay không
    if (Array.isArray(data)) {
        // LOGIC CŨ: Dành cho "Xe Cũ" và "Xe Bạn Bán"
        if (data && data.length > 0) {
            data.sort((a, b) => a.name.localeCompare(b.name));
            $.each(data, function(i, vehicleData) {
                let model = vehicleData.model.toLowerCase();
                // ======================= [PHẦN ĐƯỢC CẬP NHẬT] =======================
                let vehicleImageHTML;
                if (moddedVehicleListShowroom.includes(model)) {
                    // Nếu là xe mod, dùng ảnh cục bộ
                    vehicleImageHTML = `<img src="./img/${model}.png" onerror="this.onerror=null; this.src='./img/default.png';">`;
                } else {
                    // Nếu không, dùng ảnh từ FiveM Docs
                    let imageUrl = `https://docs.fivem.net/vehicles/${model}.webp`;
                    vehicleImageHTML = `<img src="${imageUrl}" onerror="this.onerror=null; this.src='./img/default.png';">`;
                }
                // ===================== [KẾT THÚC PHẦN CẬP NHẬT] =====================
                const formattedPrice = vehicleData.price.toLocaleString('en-US');

                const sellerName = vehicleData.sellerName || 'Không xác định';
                const sellerPhone = vehicleData.sellerPhone || 'Không xác định';
                const sellerInfoHTML = `<div class="vehicle-info">Người bán: ${sellerName} (${sellerPhone})</div>`;

                const element = `
                    <div class="showroom-card" data-plate="${vehicleData.plate}">
                        <div class="showroom-card-image">${vehicleImageHTML}</div>
                        <div class="showroom-card-details">
                            <div class="vehicle-name">${vehicleData.name}</div>
                            <div class="vehicle-info">Giá: $${formattedPrice}</div>
                            ${sellerInfoHTML}
                        </div>
                    </div>`;
                listContainer.append(element);
                $(`[data-plate="${vehicleData.plate}"]`).data('VehicleData', vehicleData);
            });
        } else {
            listContainer.html("<p style='color: #8f8f8f; text-align: center; margin-top: 5vh;'>Showroom hiện không có xe nào.</p>");
        }
    } else {
        // LOGIC MỚI: Dành cho "Xe Mới" (dữ liệu đã được phân loại theo shop)
        if (data && Object.keys(data).length > 0) {
            for (const shopName in data) {
                if (data.hasOwnProperty(shopName)) {
                    const vehicles = data[shopName];

                    listContainer.append(`<div class="showroom-category-header">${shopName}</div>`);

                    if (vehicles && vehicles.length > 0) {
                        vehicles.sort((a, b) => a.name.localeCompare(b.name));
                        $.each(vehicles, function(i, vehicleData) {
                            let model = vehicleData.model.toLowerCase();
                            // ======================= [PHẦN ĐƯỢC CẬP NHẬT] =======================
                            let vehicleImageHTML;
                             if (moddedVehicleListShowroom.includes(model)) {
                                // Nếu là xe mod, dùng ảnh cục bộ
                                vehicleImageHTML = `<img src="./images/${model}.png" onerror="this.onerror=null; this.src='./img/default.png';">`;
                            } else {
                                // Nếu không, dùng ảnh từ FiveM Docs
                                let imageUrl = `https://docs.fivem.net/vehicles/${model}.webp`;
                                vehicleImageHTML = `<img src="${imageUrl}" onerror="this.onerror=null; this.src='./img/default.png';">`;
                            }
                            // ===================== [KẾT THÚC PHẦN CẬP NHẬT] =====================
                            const formattedPrice = vehicleData.price.toLocaleString('en-US');
                            const sellerInfoHTML = `<div class="vehicle-info">Người bán: ${vehicleData.sellerName || 'Không xác định'}</div>`;

                            const element = `
                                <div class="showroom-card" data-plate="${vehicleData.plate}">
                                    <div class="showroom-card-image">${vehicleImageHTML}</div>
                                    <div class="showroom-card-details">
                                        <div class="vehicle-name">${vehicleData.name}</div>
                                        <div class="vehicle-info">Giá: $${formattedPrice}</div>
                                        ${sellerInfoHTML}
                                    </div>
                                </div>`;
                            listContainer.append(element);
                            $(`[data-plate="${vehicleData.plate}"]`).data('VehicleData', vehicleData);
                        });
                    } else {
                         listContainer.append(`<p class="no-vehicles-in-shop">Cửa hàng này hiện không có xe.</p>`);
                    }
                }
            }
        } else {
            listContainer.html("<p style='color: #8f8f8f; text-align: center; margin-top: 5vh;'>Showroom hiện không có xe nào.</p>");
        }
    }
}

    // Xử lý sự kiện khi bấm vào xe để xem chi tiết
    $(document).on('click', '.showroom-card', function(e){
        e.preventDefault();
        const vehicleData = $(this).data('VehicleData');

        if (vehicleData) {
            OpenedVehicleDetail = vehicleData; // Lưu trữ dữ liệu xe đang mở
            let model = vehicleData.model.toLowerCase();
            // ======================= [PHẦN ĐƯỢC CẬP NHẬT] =======================
            let imageUrl;
            if (moddedVehicleListShowroom.includes(model)) {
                imageUrl = `./img/${model}.png`;
            } else {
                imageUrl = `https://docs.fivem.net/vehicles/${model}.webp`;
            }
            // ===================== [KẾT THÚC PHẦN CẬP NHẬT] =====================

            // Điền thông tin cơ bản
            $('#detail-vehicle-name-showroom').text(vehicleData.name);
            $('#detail-vehicle-image-showroom').attr('src', imageUrl).on('error', function() { $(this).attr('src', './img/default.png'); });
            $('#detail-vehicle-category-showroom').text(vehicleData.category || 'Không xác định');
            $('#detail-vehicle-price-showroom').text(`$${vehicleData.price.toLocaleString('en-US')}`);
            $('#detail-vehicle-description-showroom').text(vehicleData.description || 'Không có mô tả.');

            // Thêm thông tin người bán vào chi tiết xe
            $('#detail-vehicle-seller-name-showroom').text(vehicleData.sellerName || 'Không xác định');
            $('#detail-vehicle-seller-phone-showroom').text(vehicleData.sellerPhone || 'Không xác định');

            // Xử lý và hiển thị thông tin đồ độ
            const modsListContainer = $('#detail-vehicle-mods-list-showroom');
            modsListContainer.empty();
            let hasRelevantMods = false;

            if (vehicleData.mods) {
                let modsObject = vehicleData.mods;
                if (typeof modsObject === 'string') {
                    try { modsObject = JSON.parse(modsObject); } catch (e) { modsObject = {}; }
                }

                if (typeof modsObject === 'object' && modsObject !== null) {
                    for (const key in modKeyToIdMap) {
                        if (modsObject.hasOwnProperty(key)) {
                            const modValue = modsObject[key];
                            const modId = modKeyToIdMap[key];
                            const modName = modNames[modId];
                            let modText = '';

                            if (modId === "18") { // Turbo
                                // Chỉ hiển thị "Đã lắp" nếu giá trị là true hoặc 1
                                if (modValue === true || modValue === 1) {
                                    modText = `${modName}: <span class="mod-value">Đã lắp</span>`;
                                }
                            } else if (modValue > -1) { // Chỉ hiển thị các món độ khác nếu đã được nâng cấp
                                modText = `${modName}: <span class="mod-value">Cấp ${modValue + 1}</span>`;
                            }

                            if (modText) {
                                modsListContainer.append(`<div class="mod-item-showroom">${modText}</div>`);
                                hasRelevantMods = true;
                            }
                        }
                    }
                }
            }

            if (!hasRelevantMods) {
                modsListContainer.append(`<div class="mod-item-none-showroom">Không có thông số.</div>`);
            }

            // Ẩn thanh tìm kiếm nếu đang mở
            if (ShowroomSearchActive) {
                $("#showroom-search-input").fadeOut(150);
                ShowroomSearchActive = false;
            }

            $('#showroom-vehicle-detail-view').css('display', 'flex').hide().fadeIn(200);
            $('.showroom-app-header, .showroom-search, .showroom-tabs-container, .showroom-vehicle-list').fadeOut(200);
        }
    });

    // Xử lý sự kiện khi bấm nút quay lại
    $(document).on('click', '#showroom-detail-back-button', function(e){
        e.preventDefault();
        $('#showroom-vehicle-detail-view').fadeOut(200, function(){
            $(this).css('display', 'none');
            OpenedVehicleDetail = null; // Xóa dữ liệu xe đang mở
        });
        $('.showroom-app-header, .showroom-search, .showroom-tabs-container, .showroom-vehicle-list').fadeIn(200);
    });
});