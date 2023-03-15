<?php

declare(strict_types=1);

namespace MageSuite\WidgetNotificationModal\Plugin\MageSuiteFileUpload\Model\Widget;

class ReplaceUrlToWidgetImages
{
    public const KEYS_IMAGE_URL = [
        'image_mobile',
        'image_desktop',
    ];

    protected \MageSuite\FileUpload\Model\ParseFilePathFromMediaDirectoryUrl $parseFilePathFromMediaDirectoryUrl;

    public function __construct(
        \MageSuite\FileUpload\Model\ParseFilePathFromMediaDirectoryUrl $parseFilePathFromMediaDirectoryUrl
    ) {
        $this->parseFilePathFromMediaDirectoryUrl = $parseFilePathFromMediaDirectoryUrl;
    }

    public function beforeGetWidgetDeclaration(\Magento\Widget\Model\Widget $subject, $type, $params = [], $asIs = true): ?array
    {
        if ($type !== \MageSuite\WidgetNotificationModal\Block\Widget\NotificationModal::class) {
            return null;
        }

        foreach (self::KEYS_IMAGE_URL as $key) {
            if (!empty($params[$key])) {
                $params[$key] = $this->parseFilePathFromMediaDirectoryUrl->execute($params[$key]);
            }
        }

        return [$type, $params, $asIs];
    }
}
