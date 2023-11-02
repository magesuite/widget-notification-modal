define([
	'jquery',
	'Magento_Ui/js/modal/modal',
	'jquery-ui-modules/widget',
	'mage/cookies'
], function ($, modal) {
	'use strict';

	$.widget('mgs.notificationWidgetModal', {
		options: {
			modalType: 'popup',
			modalId: '',
			modalTitle: '',
			triggerSelectors: '',
			additionalModalClasses: '',
			copyToclipboardId: '',
			showAfter: false,
			showAfterInactivity: false,
			sessionItemSeenName: '',
			dateFrom: false,
			dateTo: false,
			reopenPolicy: 'always',
			secondaryReopenPolicy: 'always',
			reopenAfter: false,
			reopenOnPages: '',
			cookieExpiration: 1,
			secondaryCookieExpiration: 1,
			openOnAbandonedCart: false
		},

		REOPEN_POLICES: {
			never: 'never',
			session: 'session',
			days: 'days',
			always: 'always',
			always_absolute: 'always_absolute'
		},

		_create: function () {
			this.sessionItemSeenName = `cs-notification-modal-${this.options.modalId}-seen`;
			this.sessionItemOpenCountName = `cs-notification-modal-${this.options.modalId}-open-count`;

			const countCookie = $.cookie(this.sessionItemOpenCountName);
			this.openingCount = countCookie ? parseInt(JSON.parse(countCookie).count, 10) : 0;
			this.lastSeen = countCookie ? JSON.parse(countCookie).lastSeen : false;


			if (this._getShouldBeDisplayed()) {
				if (this.options.openOnAbandonedCart) {
					if (this._isAbandonedCart()) {
						this._initModal();
					}
				} else {
					this._initModal();
				}
			}
		},

		_initModal: function () {
			const modalOptions = {
				'type': this.options.modalType,
				'title': this.options.modalTitle,
				'trigger': this.options.triggerSelectors,
				'responsive': true,
				'modalClass': `cs-notification-modal__modal${this.options.additionalModalClasses}`,
				'clickableOverlay': true,
				'buttons': []
			};

			if (!this.modal) {
				this.modal = modal(
					modalOptions,
					$(`#${this.options.modalId}`)
				);

				this._afterModalInitialised();
			}
		},

		_afterModalInitialised: function () {
			this._setAspectRatio();
			this._reopenPolicyActions();
			this._copyCouponCodeToClipboard();

			if (this.openingCount === 0) {
				this._showModalAutomatically();
			} else {
				if (this.options.reopenAfter) {
					this._reopenModal();
				}

				if (this.options.reopenOnPages) {
					this._reopenModalOnPages();
				}

				if (!this.options.reopenAfter && !this.options.reopenOnPages) {
					this._showModalAutomatically();
				}
			}
		},

		// Trigger modal opening automatically, based on settings in admin panel
		_showModalAutomatically: function () {
			if (!this.options.showAfter && !this.options.showAfterInactivity && !this.options.triggerSelectors) {
				this.modal.openModal();
			}

			if (this.options.showAfter) {
				this._showModalAfterTimeout(parseInt(this.options.showAfter, 10));
			}

			if (this.options.showAfterInactivity) {
				this._showModalAfterInactivityPeriod(parseInt(this.options.showAfterInactivity, 10));
			}
		},

		// Set proper aspect ratio (based on settings in admin panel). Only for popup
		_setAspectRatio: function () {
			if (this.options.modalType === 'slide') {
				return;
			}

			const aspectRatio = this.element.css('aspect-ratio');
			const maxWidth = this.element.css('max-width');

			if (aspectRatio && aspectRatio !== 'unset') {
				this.element.parents('.modal-inner-wrap').css({'aspectRatio': aspectRatio, 'width': 'auto'});
			}

			if (maxWidth && maxWidth !== 'none') {
				this.element.parents('.modal-inner-wrap').css({'max-width': maxWidth});
			}
		},

		// Trigger modal opening after given period of time
		_showModalAfterTimeout: function (timeout) {
			if (Number.isNaN(timeout)) {
				return;
			}

			const self = this;
			setTimeout(
				function () {
					if (self.modal) {
						self.modal.openModal();
					}
				},
				timeout * 1000
			);
		},

		// Trigger modal opening after given period of unactivity on the page (no mouse move, no key press)
		_showModalAfterInactivityPeriod: function (timeout) {
			if (Number.isNaN(timeout)) {
				return;
			}

			const self = this;
			let time = null;
			let timerId = null;

			window.addEventListener('load', resetTimer)
			document.addEventListener('mousemove', () => {
				throttleFunction(resetTimer, 500);
			});

			document.addEventListener('keypress', () => {
				throttleFunction(resetTimer, 500);
			});

			function resetTimer() {
				clearTimeout(time);
				time = setTimeout(function () {
					if (self.modal) {
						self.modal.openModal();
					}
				}, timeout * 1000)
			}

			function throttleFunction(func, delay) {
				if (timerId) {
					return
				}
				timerId = setTimeout(function () {
					func()
					timerId = null;
				}, delay)
			}
		},

		_copyCouponCodeToClipboard: function () {
			const copyCouponCodeEl = document.querySelector(`#${this.options.modalId} .copy-coupon-code`);
			const couponCodeEl = document.querySelector(`#${this.options.modalId} .coupon-code`);
			const copyInput = document.querySelector(`#${this.options.copyToclipboardId}`);

			if (couponCodeEl && copyInput) {
				copyInput.value = couponCodeEl.textContent;

				$(copyCouponCodeEl).on('click', function (e) {
					e.preventDefault();
					copyInput.select();
					document.execCommand('copy');
					copyInput.blur();

					copyCouponCodeEl.classList.add('copied');
					couponCodeEl.classList.add('copied');
				});
			}
		},

		_reopenPolicyActions: function () {
			const $modal = $(`#${this.options.modalId}`);
			const self = this;

			$modal.on('modalclosed', function () {
				this._onModalClosed();
			}.bind(this));

			$(`#${this.options.modalId}`).on('click', '.cs-image-teaser__cta, a, button:not(.tocart)', function (e) {
				e.preventDefault();

				if (e.target.classList.contains('coupon-code') || e.target.classList.contains('copy-coupon-code')) {
					return;
				}

				self.modal.closeModal();

				const redirectUrl = e.target.tagName === 'A' ? e.target.href : e.target.closest('.cs-image-teaser__link')?.href;

				if (redirectUrl) {
					document.location = redirectUrl;
				}
			}.bind(this));
		},

		_onModalClosed: function () {
			if (this.options.reopenPolicy === this.REOPEN_POLICES.always_absolute) {
				return
			}

			const policy = this.openingCount === 0 ? this.options.reopenPolicy : this.options.secondaryReopenPolicy;
			this._handleReopenPolicy(policy);

			if (this.openingCount === 0) {
				if (this.options.reopenAfter) {
					this._showModalAfterTimeout(parseInt(this.options.reopenAfter, 10));
				}
			} else {
				if (this.options.secondaryReopenPolicy !== 'always') {
					$.removeCookie(this.sessionItemOpenCountName);
				}
			}

			this._handleOpeningCount();

			if (!this.options.reopenAfter || !this.options.reopenOnPages) {
				const $modal = $(`#${this.options.modalId}`);

				$modal.data('mage-modal').openModal = () => false;
			}
		},

		_getShouldBeDisplayed: function () {
			if (!this._getIsInDateRange()) {
				return false
			}

			switch (this.options.reopenPolicy) {
				case this.REOPEN_POLICES.never:
				case this.REOPEN_POLICES.days:
					return !$.cookie(this.sessionItemSeenName);

				case this.REOPEN_POLICES.session:
					return !sessionStorage.getItem(this.sessionItemSeenName);

				case this.REOPEN_POLICES.always:
					return true;

				default:
					return true;
			}
		},

		_getIsInDateRange: function () {
			const {dateFrom, dateTo} = this.options,
				parsedDateFrom = !!dateFrom ? new Date(dateFrom).toISOString() : false,
				parsedDateTo = !!dateTo ? new Date(dateTo).toISOString() : false,
				currentDate = new Date().toISOString();

			if (!!parsedDateFrom && parsedDateFrom > currentDate) {
				return false
			}

			return !(!!parsedDateTo && parsedDateTo < currentDate);
		},

		_handleReopenPolicy: function (reopenPolicy) {
			switch (reopenPolicy) {
				case this.REOPEN_POLICES.never:
					const expiresNever = new Date();
					expiresNever.setTime(expiresNever.getTime() + (365 * 24 * 60 * 60 * 1000));
					$.cookie(this.sessionItemSeenName, true, {expires: expiresNever});
					break;

				case this.REOPEN_POLICES.session:
					sessionStorage.setItem(this.sessionItemSeenName, true);
					break;

				case this.REOPEN_POLICES.days:
					const expires = new Date();
					let cookieExpiration = this.openingCount === 0 ? parseInt(this.options.cookieExpiration) : parseInt(this.options.secondaryCookieExpiration);
					cookieExpiration = !Number.isNaN(cookieExpiration) ? cookieExpiration : 3;

					expires.setTime(expires.getTime() + (cookieExpiration * 24 * 60 * 60 * 1000));
					$.cookie(this.sessionItemSeenName, true, {expires});
					break;

				case this.REOPEN_POLICES.always:
				case this.REOPEN_POLICES.always_absolute:
				default:
					return
			}
		},

		_handleOpeningCount: function () {
			this.openingCount++;
			$.cookie(this.sessionItemOpenCountName, JSON.stringify({count: this.openingCount, lastSeen: new Date()}));
		},

		_reopenModal: function () {
			const lastSeen = Date.parse(this.lastSeen);
			const now = new Date();

			const secsFromLastSeen = Math.round(Math.abs(Date.parse(now) - lastSeen) / 1000);
			const reopenAfter = parseInt(this.options.reopenAfter, 10);

			if (reopenAfter < secsFromLastSeen) {
				this.modal.openModal();
			} else {
				this._showModalAfterTimeout(reopenAfter - secsFromLastSeen);
			}
		},

		_reopenModalOnPages: function () {
			if ($(this.options.reopenOnPages).length) {
				this.modal.openModal();
			}
		},

		_isAbandonedCart: function () {
			// If the session is new and there is at least one item in the cart reset modal cookies and show modal
			// according to initial rules
			if (!sessionStorage.getItem('session')) {
				sessionStorage.setItem('session', JSON.stringify(new Date()));

				const mageCache = JSON.parse(localStorage.getItem('mage-cache-storage'));
				const cart = mageCache ? mageCache['cart'] : false;
				const cartCount = cart ? parseInt(cart['summary_count']) : 0;

				return cartCount;
			}
		},
	});

	return $.mgs.notificationWidgetModal;
});
