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
			sessionItemSeenName: '',
			dateFrom: false,
			dateTo: false,
			reopenPolicy: 'always',
			cookieExpiration: 1
		},

		REOPEN_POLICES: {
			never: 'never',
			session: 'session',
			days: 'days',
			always: 'always'
		},

		_create: function () {
			this.sessionItemSeenName = `cs-notification-modal-${this.options.modalId}-seen`;

			if (this._getShouldBeDisplayed()) {
				this._initModal();
			}
		},

		_initModal: function() {
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

		_afterModalInitialised: function() {
			this._setAspectRatio();
			this._showModalAfterTimeout();
			this._doNotShowModalAgainActions();
			this._copyCouponCodeToClipboard();
		},

		_setAspectRatio: function() {
			if (this.options.modalType === 'slide') {
				return;
			}

			const aspectRatio = this.element.css('aspect-ratio');

			if (aspectRatio && aspectRatio !== 'unset') {
				this.element.parents('.modal-inner-wrap').css({'aspectRatio': aspectRatio, 'width': 'auto'});
			}
		},

		_showModalAfterTimeout: function() {
			const timeout = parseInt(this.options.showAfter, 10);
			if (Number.isNaN(timeout)) {
				return;
			}

			const self = this;
			setTimeout(
				function() {
					if (self.modal) {
						self.modal.openModal();
					}
				},
				timeout * 1000
			);
		},

		_copyCouponCodeToClipboard: function() {
			const couponCodeEl = document.querySelector(`#${this.options.modalId} .coupon-code`);
			const copyInput = document.querySelector(`#${this.options.copyToclipboardId}`);

			if (couponCodeEl && copyInput) {
				copyInput.value = couponCodeEl.textContent;

				$(couponCodeEl).on('click', function(e) {
					e.preventDefault();
					copyInput.select();
					document.execCommand('copy');
					copyInput.blur();
				});
			}
		},

		_doNotShowModalAgainActions: function() {
			const $modal = $(`#${this.options.modalId}`);

			$modal.on('modalclosed', function () {
				this._setDoNotShowModalAgain();
				$modal.data('mage-modal').openModal = () => false;
			}.bind(this));

			$(`#${this.options.modalId} .cs-image-teaser__cta, #${this.options.modalId} a, #${this.options.modalId} button`).on('click', function (ev) {
				ev.preventDefault();

				this._setDoNotShowModalAgain();
				$modal.data('mage-modal').openModal = () => false;

				if (ev.target.classList.contains('coupon-code')) {
					return;
				}

				$modal.modal('closeModal');

				const target = ev.target;
				const href = target.tagName === 'A' ? target.href : target.closest('.cs-image-teaser__link').href;

				document.location = href;
			}.bind(this));
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

		_setDoNotShowModalAgain: function () {
			switch (this.options.reopenPolicy) {
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
					let cookieExpiration = parseInt(this.options.cookieExpiration);
					cookieExpiration = !Number.isNaN(cookieExpiration) ? cookieExpiration : 3;

					expires.setTime(expires.getTime() + (cookieExpiration * 24 * 60 * 60 * 1000));
					$.cookie(this.sessionItemSeenName, true, {expires});
					break;

				case this.REOPEN_POLICES.always:
				default:
					return
			}
		}
	});

	return $.mgs.notificationWidgetModal;
});
