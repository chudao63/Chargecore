import streamlit as st
import pandas as pd
from io import BytesIO
import re
import unicodedata


# =========================
# CẤU HÌNH CỘT HARD CODE
# =========================

PROVINCE_COL = "Tỉnh/Thành phố"
DUPLICATE_COL = "ID Yêu cầu"


# =========================
# HARD CODE DANH SÁCH TỈNH
# =========================

EC_PROVINCES = {
    "Tỉnh Điện Biên",
    "Tỉnh Lai Châu",
    "Tỉnh Lào Cai",
    "Tỉnh Sơn La",
    "Tỉnh Yên Bái",
}

ITS_PROVINCES = {
    "Tỉnh Phú Thọ",
    "Tỉnh Hà Giang",
    "Tỉnh Hoà Bình",
    "Tỉnh Tuyên Quang",
}


# =========================
# HÀM CHUẨN HÓA VÀ PHÂN LOẠI
# =========================

def remove_accents(text):
    """
    Bỏ dấu tiếng Việt để tránh lỗi Hòa / Hoà, Thanh Hóa / Thanh Hoá...
    """
    text = unicodedata.normalize("NFD", text)
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    text = text.replace("đ", "d").replace("Đ", "D")
    return text


def normalize_text(value):
    """
    Chuẩn hóa text:
    - Bỏ NaN
    - Bỏ khoảng trắng thừa
    - Chuyển chữ thường
    - Bỏ dấu tiếng Việt
    """
    if pd.isna(value):
        return ""

    value = str(value).strip()
    value = re.sub(r"\s+", " ", value)
    value = value.lower()
    value = remove_accents(value)
    return value


EC_NORMALIZED = {normalize_text(x) for x in EC_PROVINCES}
ITS_NORMALIZED = {normalize_text(x) for x in ITS_PROVINCES}


def classify_province(province):
    province_norm = normalize_text(province)

    if province_norm in EC_NORMALIZED:
        return "EC"

    if province_norm in ITS_NORMALIZED:
        return "ITs"

    return "Chua_phan_loai"


def auto_adjust_excel_width(writer, sheet_name, dataframe):
    worksheet = writer.sheets[sheet_name]

    for idx, col in enumerate(dataframe.columns):
        try:
            column_values = dataframe[col].fillna("").tolist()

            max_cell_len = max(
                [len(str(value)) for value in column_values],
                default=0
            )

            max_len = max(max_cell_len, len(str(col)))
            worksheet.set_column(idx, idx, min(max_len + 2, 50))

        except Exception:
            worksheet.set_column(idx, idx, 20)


def create_duplicate_check(df_result):
    """
    Tạo sheet Duplicate_Check.
    Chỉ liệt kê dòng trùng, không xóa bất kỳ dòng nào.
    """
    if DUPLICATE_COL not in df_result.columns:
        return pd.DataFrame({
            "Thong_bao": [f"Không tìm thấy cột {DUPLICATE_COL} để check trùng"]
        })

    duplicate_key = df_result[DUPLICATE_COL].astype("string").str.strip()

    valid_duplicate_key = duplicate_key.notna() & (duplicate_key != "")

    duplicate_check = df_result[
        valid_duplicate_key & duplicate_key.duplicated(keep=False)
    ].copy()

    if duplicate_check.empty:
        return pd.DataFrame({
            "Thong_bao": [f"Không có ticket trùng theo cột {DUPLICATE_COL}"]
        })

    duplicate_check.insert(0, "Dong_sheet_goc", duplicate_check.index + 2)
    duplicate_check.insert(1, "Cot_check_trung", DUPLICATE_COL)

    duplicate_check = duplicate_check.sort_values(by=DUPLICATE_COL)

    return duplicate_check


def count_duplicate_info(df_result):
    """
    Đếm số dòng trùng và số giá trị trùng khác nhau.
    """
    if DUPLICATE_COL not in df_result.columns:
        return 0, 0

    duplicate_key = df_result[DUPLICATE_COL].astype("string").str.strip()
    valid_duplicate_key = duplicate_key.notna() & (duplicate_key != "")

    duplicate_rows = duplicate_key[
        valid_duplicate_key & duplicate_key.duplicated(keep=False)
    ]

    duplicate_count = len(duplicate_rows)
    duplicate_unique_count = duplicate_rows.nunique()

    return duplicate_count, duplicate_unique_count


# =========================
# STREAMLIT APP
# =========================

st.set_page_config(
    page_title="Ticket Splitter EC / ITs",
    layout="wide"
)

st.title("Ticket Splitter EC / ITs")

st.write(
    "App lấy toàn bộ dữ liệu từ một sheet tổng, sau đó tự chia theo cột **Tỉnh/Thành phố**."
)

st.info(
    f"""
    Cấu hình đang dùng:
    - Cột chia nhóm: **{PROVINCE_COL}**
    - Cột check trùng: **{DUPLICATE_COL}**
    """
)

uploaded_file = st.file_uploader("Upload file Excel", type=["xlsx"])

if uploaded_file:
    excel = pd.ExcelFile(uploaded_file)

    selected_sheet = st.selectbox(
        "Chọn sheet tổng cần xử lý",
        excel.sheet_names
    )

    df_all = pd.read_excel(uploaded_file, sheet_name=selected_sheet)

    st.subheader("Preview dữ liệu từ sheet tổng")
    st.write(f"Sheet đang xử lý: **{selected_sheet}**")
    st.write(f"Tổng số dòng dữ liệu: **{len(df_all)}**")
    st.dataframe(df_all.head(30), use_container_width=True)

    # Check bắt buộc có cột Tỉnh/Thành phố
    if PROVINCE_COL not in df_all.columns:
        st.error(
            f"Không tìm thấy cột **{PROVINCE_COL}** trong sheet này. "
            f"Anh kiểm tra lại tên cột trong file Excel nhé."
        )
        st.stop()

    if DUPLICATE_COL not in df_all.columns:
        st.warning(
            f"Không tìm thấy cột **{DUPLICATE_COL}**. "
            f"App vẫn chia EC / ITs bình thường, nhưng sheet Duplicate_Check sẽ báo không có cột để kiểm tra."
        )

    if st.button("Xử lý và chia sheet"):
        df_result = df_all.copy()

        # Tạo cột nhóm xử lý
        nhom_xu_ly_series = df_result[PROVINCE_COL].apply(classify_province)

        # Chèn cột Nhom_xu_ly ngay sau cột Tỉnh/Thành phố
        province_col_index = list(df_result.columns).index(PROVINCE_COL)
        df_result.insert(province_col_index + 1, "Nhom_xu_ly", nhom_xu_ly_series)

        # Chia sheet nhỏ
        df_ec = df_result[df_result["Nhom_xu_ly"] == "EC"].copy()
        df_its = df_result[df_result["Nhom_xu_ly"] == "ITs"].copy()
        df_unclassified = df_result[df_result["Nhom_xu_ly"] == "Chua_phan_loai"].copy()

        # Duplicate check
        duplicate_check = create_duplicate_check(df_result)
        duplicate_count, duplicate_unique_count = count_duplicate_info(df_result)

        # Count tổng
        total_count = len(df_result)
        ec_count = len(df_ec)
        its_count = len(df_its)
        unclassified_count = len(df_unclassified)

        # Summary tổng
        summary_total = pd.DataFrame({
            "Loai": [
                "EC",
                "ITs",
                "Chua_phan_loai",
                "Tong_tat_ca",
                "Dong_trung",
                "Gia_tri_trung_khac_nhau"
            ],
            "So_luong": [
                ec_count,
                its_count,
                unclassified_count,
                total_count,
                duplicate_count,
                duplicate_unique_count
            ]
        })

        # Summary chi tiết theo tỉnh/thành phố
        summary_by_province = (
            df_result
            .groupby(["Nhom_xu_ly", PROVINCE_COL], dropna=False)
            .size()
            .reset_index(name="So_luong")
            .sort_values(["Nhom_xu_ly", "So_luong"], ascending=[True, False])
        )

        st.subheader("Kết quả sau khi chia")

        col1, col2, col3, col4, col5 = st.columns(5)

        with col1:
            st.metric("Tổng ticket", total_count)

        with col2:
            st.metric("EC", ec_count)

        with col3:
            st.metric("ITs", its_count)

        with col4:
            st.metric("Chưa phân loại", unclassified_count)

        with col5:
            st.metric("Dòng trùng", duplicate_count)

        st.subheader("Summary tổng")
        st.dataframe(summary_total, use_container_width=True)

        st.subheader("Summary theo tỉnh/thành phố")
        st.dataframe(summary_by_province, use_container_width=True)

        st.subheader("Duplicate Check")
        st.dataframe(duplicate_check, use_container_width=True)

        output = BytesIO()

        with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
            # 1. Giữ lại sheet gốc để so sánh
            df_all.to_excel(writer, sheet_name="Sheet_goc", index=False)

            # 2. Sheet gốc có thêm cột Nhom_xu_ly
            df_result.to_excel(writer, sheet_name="Sheet_goc_da_phan_loai", index=False)

            # 3. Các sheet nhỏ
            df_ec.to_excel(writer, sheet_name="EC", index=False)
            df_its.to_excel(writer, sheet_name="ITs", index=False)
            df_unclassified.to_excel(writer, sheet_name="Chua_phan_loai", index=False)

            # 4. Sheet check trùng
            duplicate_check.to_excel(writer, sheet_name="Duplicate_Check", index=False)

            # 5. Summary
            summary_total.to_excel(writer, sheet_name="Summary", index=False, startrow=0)
            summary_by_province.to_excel(writer, sheet_name="Summary", index=False, startrow=9)

            # Auto width
            auto_adjust_excel_width(writer, "Sheet_goc", df_all)
            auto_adjust_excel_width(writer, "Sheet_goc_da_phan_loai", df_result)
            auto_adjust_excel_width(writer, "EC", df_ec)
            auto_adjust_excel_width(writer, "ITs", df_its)
            auto_adjust_excel_width(writer, "Chua_phan_loai", df_unclassified)
            auto_adjust_excel_width(writer, "Duplicate_Check", duplicate_check)
            auto_adjust_excel_width(writer, "Summary", summary_by_province)

        output.seek(0)

        st.download_button(
            label="Tải file Excel đã chia",
            data=output,
            file_name="ket_qua_chia_EC_ITs.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )