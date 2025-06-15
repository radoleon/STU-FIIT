<x-app-layout>
    <style>
        .admin-image-container {
            position: relative;
            display: inline-block;
        }
        .admin-delete-button {
            position: absolute;
            top: -10px;
            right: -10px;
            z-index: 10;
        }
    </style>
    <main class="container py-5 my-5">
        <div class="row justify-content-center col-lg-8 mx-auto p-4 bg-light">
            <h2 class="fs-3 text-secondary text-center mb-3">
                {{ isset($product) ? 'Upraviť produkt' : 'Nový produkt' }}
            </h2>

            @if (session('success'))
                <div class="alert alert-success">{{ session('success') }}</div>
            @endif
            @if ($errors->any())
                <div class="alert alert-danger">
                    <ul class="m-0">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form 
                action="{{ isset($product) ? route('admin.storeEdit', ['id' => $product->id]) : route('admin.store') }}" 
                method="POST" 
                enctype="multipart/form-data"
            >
                @csrf
                @if (isset($product))
                    @method('PUT')
                @endif
                <div class="row">
                    <div class="col-md-8 mb-3">
                        <label for="title" class="form-label">Názov</label>
                        <input
                            id="title"
                            type="text"
                            class="form-control @error('title') is-invalid @enderror"
                            name="title"
                            value="{{ old('title', $product->title ?? '') }}"
                            required
                        />
                        @error('title')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="col-md-4 mb-3">
                        <label for="code" class="form-label">Kód</label>
                        <input
                            id="code"
                            type="text"
                            class="form-control @error('code') is-invalid @enderror"
                            name="code"
                            value="{{ old('code', $product->code ?? '') }}"
                            required
                        />
                        @error('code')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                </div>
                <div class="mb-3">
                    <label for="description" class="form-label">Popis</label>
                    <textarea
                        id="description"
                        class="form-control @error('description') is-invalid @enderror"
                        name="description"
                        rows="5"
                        required
                    >{{ old('description', $product->description ?? '') }}</textarea>
                    @error('description')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>
                <div class="mb-3">
                    <label class="form-label">Hlavný obrázok</label>
                    <div class="input-group">
                        <label class="input-group-text" for="main_image">
                            <i class="bi bi-image"></i>
                        </label>
                        <input
                            class="form-control @error('main_image') is-invalid @enderror"
                            type="file"
                            id="main_image"
                            name="main_image"
                            accept="image/*"
                            {{ isset($product) ? '' : 'required' }}
                        />
                        @error('main_image')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div id="main_image_preview" class="col-4 col-sm-3 col-md-2 mt-2">
                        @if(isset($mainImage))
                            <div class="admin-image-container border border-secondary mt-3">
                                <img src="{{ asset('storage/' . $mainImage->path) }}" class="img-fluid" alt="Main Image">
                                <div class="admin-delete-button d-none gap-1 badge text-bg-dark">
                                    <input type="checkbox" value="{{ $mainImage->id }}">
                                    <label>Odstrániť</label>
                                </div>
                            </div>
                        @endif
                    </div>
                </div>
                @for($i = 0; $i < 3; $i++)
                    <div class="mb-3">
                        <label class="form-label">Detail produktu ({{ $i + 1 }})</label>
                        <div class="input-group">
                            <label class="input-group-text" for="detail_image_{{ $i + 1 }}">
                                <i class="bi bi-image"></i>
                            </label>
                            <input
                                class="form-control @error('detail_image_' . ($i + 1)) is-invalid @enderror"
                                type="file"
                                id="detail_image_{{ $i + 1 }}"
                                name="detail_image_{{ $i + 1 }}"
                                accept="image/*"
                            />
                            @error('detail_image_' . ($i + 1))
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        <div id="detail_image_preview_{{ $i + 1 }}" class="col-4 col-sm-3 col-md-2 mt-2">
                            @if(isset($detailImages[$i]))
                                <div class="admin-image-container border border-secondary mt-3">
                                    <img src="{{ asset('storage/' . $detailImages[$i]->path) }}" class="img-fluid" alt="Detail Image {{ $i + 1 }}">
                                    <div class="admin-delete-button d-flex gap-1 badge text-bg-dark">
                                        <input type="checkbox" name="delete_images[]" value="{{ $detailImages[$i]->id }}">
                                        <label>Odstrániť</label>
                                    </div>
                                </div>
                            @endif
                        </div>
                    </div>
                @endfor
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="category_id" class="form-label">Kategória</label>
                        <select
                            id="category_id"
                            class="form-select @error('category_id') is-invalid @enderror"
                            name="category_id"
                            required
                        >
                            <option value="" selected hidden>Vybrať kategóriu</option>
                            @foreach ($categories as $category)
                            <option 
                                value="{{ $category->id }}" 
                                {{ old('category_id', $product->category_id ?? '') == $category->id ? 'selected' : '' }}
                            >
                                    {{ $category->name }}
                                </option>
                            @endforeach
                        </select>
                        @error('category_id')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="color_id" class="form-label">Farba</label>
                        <select
                            id="color_id"
                            class="form-select @error('color_id') is-invalid @enderror"
                            name="color_id"
                            required
                        >
                            <option value="" selected hidden>Vybrať farbu</option>
                            @foreach ($colors as $color)
                                <option 
                                    value="{{ $color->id }}" 
                                    {{ old('color_id', $product->color_id ?? '') == $color->id ? 'selected' : '' }}
                                >
                                    {{ $color->name }}
                                </option>
                            @endforeach
                        </select>
                        @error('color_id')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="material_id" class="form-label">Materiál</label>
                        <select
                            id="material_id"
                            class="form-select @error('material_id') is-invalid @enderror"
                            name="material_id"
                            required
                        >
                            <option value="" selected hidden>Vybrať materiál</option>
                            @foreach ($materials as $material)
                            <option 
                                value="{{ $material->id }}" 
                                {{ old('material_id', $product->material_id ?? '') == $material->id ? 'selected' : '' }}
                            >
                                    {{ $material->name }}
                                </option>
                            @endforeach
                        </select>
                        @error('material_id')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="placement_id" class="form-label">Umiestnenie</label>
                        <select
                            id="placement_id"
                            class="form-select @error('placement_id') is-invalid @enderror"
                            name="placement_id"
                            required
                        >
                            <option value="" selected hidden>Vybrať umiestnenie</option>
                            @foreach ($placements as $placement)
                            <option 
                            value="{{ $placement->id }}" 
                                {{ old('placement_id', $product->placement_id ?? '') == $placement->id ? 'selected' : '' }}
                            >
                                    {{ $placement->name }}
                                </option>
                            @endforeach
                        </select>
                        @error('placement_id')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-8 mb-3">
                        <label for="price" class="form-label">Cena</label>
                        <div class="input-group">
                            <span class="input-group-text" id="priceEuro">€</span>
                            <input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0.01"
                                class="form-control @error('price') is-invalid @enderror"
                                name="price"
                                value="{{ old('price', $product->price ?? '') }}"
                                aria-describedby="priceEuro"
                                required
                            />
                            @error('price')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>
                    <div class="col-md-4 mb-4">
                        <label class="form-label">Rozmery Š-D-H (cm)</label>
                        <div class="d-flex align-items-center gap-1">
                            <input
                                type="number"
                                min="1"
                                class="form-control @error('width') is-invalid @enderror"
                                name="width"
                                value="{{ old('width', $product->width ?? '') }}"
                                placeholder="Š"
                                required
                            />
                            <i class="bi bi-x"></i>
                            <input
                                type="number"
                                min="1"
                                class="form-control @error('length') is-invalid @enderror"
                                name="length"
                                value="{{ old('length', $product->length ?? '') }}"
                                placeholder="D"
                                required
                            />
                            <i class="bi bi-x"></i>
                            <input
                                type="number"
                                min="1"
                                class="form-control @error('depth') is-invalid @enderror"
                                name="depth"
                                value="{{ old('depth', $product->depth ?? '') }}"
                                placeholder="H"
                                required
                            />
                            @error('width')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                            @error('length')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                            @error('depth')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="in_stock" class="form-label">Na sklade (ks)</label>
                    <input
                        id="in_stock"
                        type="number"
                        class="form-control @error('in_stock') is-invalid @enderror"
                        name="in_stock"
                        value="{{ old('in_stock', $product->in_stock ?? '') }}"
                        min="0"
                    />
                    @error('in_stock')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>
                <div class="d-flex justify-content-between">
                    <a href="{{ route('admin.index') }}" class="btn btn-outline-secondary">
                        <i class="bi bi-arrow-left"></i>
                        Späť
                    </a>
                    <button type="submit" class="btn btn-success">
                        <i class="bi bi-check"></i>
                        {{ isset($product) ? 'Upraviť' : 'Pridať' }}
                    </button>
                </div>
            </form>
        </div>
    </main>
    <script>
        const imageIds = [
            { input: "main_image", preview: "main_image_preview" },
            { input: "detail_image_1", preview: "detail_image_preview_1" },
            { input: "detail_image_2", preview: "detail_image_preview_2" },
            { input: "detail_image_3", preview: "detail_image_preview_3" },
        ];

        imageIds.forEach((imageId) => {
            document.getElementById(imageId.input).addEventListener("change", (event) => {
                const files = event.target.files;
                const previewContainer = document.getElementById(imageId.preview);

                if (files.length === 0) return;

                const existingCheckbox = previewContainer.querySelector('input[type="checkbox"]');
                
                if (existingCheckbox) {
                    existingCheckbox.checked = true;
                    existingCheckbox.disabled = true;
                    
                    const existingImage = previewContainer.querySelector('.admin-image-container');
                    
                    if (existingImage) {
                        existingImage.style.opacity = '0.5';
                    }
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const container = document.createElement("div");
                    container.classList.add(
                        "admin-image-container",
                        "border",
                        "border-secondary",
                        "mt-3"
                    );

                    const deleteButton = document.createElement("button");
                    deleteButton.innerHTML = "<i class='bi bi-trash'></i>";
                    deleteButton.classList.add(
                        "btn",
                        "btn-sm",
                        "btn-danger",
                        "admin-delete-button"
                    );

                    deleteButton.onclick = () => {
                        container.remove();
                        event.target.value = "";

                        if (existingCheckbox) {
                            existingCheckbox.checked = false;
                            existingCheckbox.disabled = false;
                            
                            const existingImage = previewContainer.querySelector('.admin-image-container');

                            if (existingImage) {
                                existingImage.style.opacity = '1';
                            }
                        }
                    };

                    const img = document.createElement("img");
                    img.classList.add("img-fluid");
                    img.src = e.target.result;

                    container.appendChild(deleteButton);
                    container.appendChild(img);
                    previewContainer.appendChild(container);
                };

                reader.readAsDataURL(files[0]);
            });
        });
    </script>
</x-app-layout>
